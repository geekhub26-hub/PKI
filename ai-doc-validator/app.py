import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Optional, Tuple

import cv2
import numpy as np
import pytesseract
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

# ─── Config ───────────────────────────────────────────────────────────────────

MAX_FILE_SIZE    = int(os.getenv("AI_MAX_FILE_SIZE_BYTES", str(20 * 1024 * 1024)))
REQUIRED_API_KEY = os.getenv("LOCAL_AI_API_KEY", "").strip()
MODEL_DIR        = Path(os.getenv("MODEL_DIR", "/tmp/pki-models"))
# ArcFace cosine similarity threshold (0–1). Default 0.40 (stricter than SFace 0.363).
# Increase to be more lenient, decrease to be stricter.
COSINE_THRESHOLD = float(os.getenv("FACE_COSINE_THRESHOLD", "0.40"))
# Minimum face area as % of image area — rejects tiny/distant faces in selfies
MIN_FACE_AREA_RATIO = float(os.getenv("MIN_FACE_AREA_RATIO", "0.03"))

# ─── Model singleton ──────────────────────────────────────────────────────────

_face_app = None  # insightface FaceAnalysis instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _face_app
    try:
        from insightface.app import FaceAnalysis
        fa = FaceAnalysis(
            name="buffalo_l",
            root=str(MODEL_DIR),
            providers=["CPUExecutionProvider"],
        )
        fa.prepare(ctx_id=-1, det_size=(640, 640))
        _face_app = fa
        print("InsightFace buffalo_l chargé (ArcFace R50 + SCRFD)")
    except Exception as e:
        print(f"WARNING: InsightFace non disponible: {e}")
    yield


app = FastAPI(title="PKI Identity Document Validator", lifespan=lifespan)

# ─── Auth helper ──────────────────────────────────────────────────────────────


def _check_api_key(key: str) -> None:
    if REQUIRED_API_KEY and key != REQUIRED_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ─── OCR helpers ──────────────────────────────────────────────────────────────


def _contains_any(text: str, keys: Tuple[str, ...]) -> bool:
    return any(k in text for k in keys)


def _normalize_text(text: str) -> str:
    text = text.lower()
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_ocr_text(raw: bytes) -> str:
    arr = np.frombuffer(raw, np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unsupported image format")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
    text = pytesseract.image_to_string(thr, lang="eng+fra", config="--oem 3 --psm 6")
    if not text.strip():
        text = pytesseract.image_to_string(gray, lang="eng+fra", config="--oem 3 --psm 6")
    return _normalize_text(text)


def _classify(text: str, filename: str, expected_type: str) -> Dict:
    cni_score = 0
    passport_score = 0

    if _contains_any(filename, ("cni", "identite", "identity", "id_card", "national_id", "carte")):
        cni_score += 2
    if _contains_any(text, ("carte nationale", "carte d'identite", "national identity", "id card", "numero cni", "date de naissance")):
        cni_score += 4

    if _contains_any(filename, ("passport", "passeport", "mrz")):
        passport_score += 2
    if _contains_any(text, ("passport", "passeport", "travel document", "nationality", "date of expiry")):
        passport_score += 4

    if "p<" in text:
        passport_score += 2
    if re.search(r"[a-z0-9<]{25,}", text):
        passport_score += 1

    cni_conf  = min(1.0, cni_score / 7.0)
    pass_conf = min(1.0, passport_score / 7.0)

    label = "UNKNOWN"
    accepted = False
    confidence = 0.0
    message = "Document d'identite non detecte"

    if expected_type == "CNI":
        accepted   = cni_score >= 4 and cni_score >= passport_score
        confidence = cni_conf
        label      = "CNI" if accepted else "UNKNOWN"
        message    = "CNI detectee" if accepted else "Le document ne ressemble pas a une CNI"
    elif expected_type in {"PASSEPORT", "PASSPORT"}:
        accepted   = passport_score >= 4 and passport_score >= cni_score
        confidence = pass_conf
        label      = "PASSEPORT" if accepted else "UNKNOWN"
        message    = "Passeport detecte" if accepted else "Le document ne ressemble pas a un passeport"
    else:
        if cni_score >= passport_score and cni_score >= 4:
            accepted, confidence, label, message = True, cni_conf, "CNI", "Document d'identite detecte: CNI"
        elif passport_score >= 4:
            accepted, confidence, label, message = True, pass_conf, "PASSEPORT", "Document d'identite detecte: PASSEPORT"

    return {
        "accepted": accepted,
        "confidence": round(float(confidence), 3),
        "label": label,
        "message": message,
        "scores": {"cni": cni_score, "passport": passport_score},
    }

# ─── Face helpers ─────────────────────────────────────────────────────────────


def _enhance_document(img: np.ndarray) -> np.ndarray:
    """CLAHE + sharpening: improves face detection in document headshots."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    return cv2.filter2D(enhanced, -1, kernel)


def _extract_embedding(image_bytes: bytes, label: str = "image", document: bool = False) -> np.ndarray:
    """
    Detect the best face and return its L2-normalized ArcFace embedding.
    When document=True, applies contrast enhancement before detection.
    """
    if _face_app is None:
        raise RuntimeError("Modèles de reconnaissance faciale non disponibles")

    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Format d'image non supporté")

    img_h, img_w = img.shape[:2]
    img_area = img_h * img_w

    # For document photos: try enhanced version first, fall back to original
    candidates = [_enhance_document(img), img] if document else [img]
    faces = []
    for candidate in candidates:
        faces = _face_app.get(candidate)
        if faces:
            break

    if not faces:
        raise ValueError(f"Aucun visage détecté dans {label}")

    # Pick the largest face by bounding-box area
    def face_area(f):
        x1, y1, x2, y2 = f.bbox
        return (x2 - x1) * (y2 - y1)

    best = max(faces, key=face_area)
    area_ratio = face_area(best) / img_area

    # Reject selfies where the face is too small (person too far from camera)
    if not document and area_ratio < MIN_FACE_AREA_RATIO:
        raise ValueError(
            "Visage trop loin de la caméra — rapprochez-vous et centrez votre visage dans l'ovale"
        )

    return best.normed_embedding  # L2-normalized → cosine = dot product

# ─── Endpoints ────────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {
        "status": "ok",
        "face_models": _face_app is not None,
        "model": "InsightFace buffalo_l (ArcFace R50 + SCRFD)",
        "threshold": COSINE_THRESHOLD,
    }


@app.post("/validate")
async def validate_document(
    file: UploadFile = File(...),
    expectedType: str = Form(default=""),
    x_api_key: str = Header(default=""),
):
    _check_api_key(x_api_key)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported by local validator")

    try:
        text = _extract_ocr_text(raw)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"OCR failure: {ex}") from ex

    result = _classify(
        text=text,
        filename=file.filename.lower(),
        expected_type=(expectedType or "").strip().upper(),
    )
    result["ocrTextLength"] = len(text)
    return result


@app.post("/compare-faces")
async def compare_faces(
    document: UploadFile = File(...),
    selfie: UploadFile = File(...),
    x_api_key: str = Header(default=""),
):
    """
    Compare le visage sur la pièce d'identité avec le selfie.
    Retourne {"match": bool, "similarity": float, "message": str}.
    Utilise InsightFace ArcFace R50 (cosine similarity, seuil configurable).
    """
    _check_api_key(x_api_key)

    if _face_app is None:
        return {
            "match": True,
            "similarity": 0.5,
            "message": "Modèles de reconnaissance faciale non disponibles (mode souple)",
        }

    doc_raw    = await document.read()
    selfie_raw = await selfie.read()

    if not doc_raw or not selfie_raw:
        raise HTTPException(status_code=400, detail="Fichiers manquants")
    if len(doc_raw) > MAX_FILE_SIZE or len(selfie_raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux")

    try:
        doc_emb = _extract_embedding(doc_raw, label="la pièce d'identité", document=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Pièce d'identité: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        selfie_emb = _extract_embedding(selfie_raw, label="le selfie", document=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Selfie: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # ArcFace embeddings are L2-normalized → cosine similarity = dot product
    cosine = float(np.dot(doc_emb, selfie_emb))
    match  = cosine >= COSINE_THRESHOLD

    return {
        "match":      match,
        "similarity": round(cosine, 4),
        "message":    "Visages identiques" if match else "Le selfie ne correspond pas au visage sur la pièce d'identité",
    }
