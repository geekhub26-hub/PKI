import os
import re
import urllib.request
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
COSINE_THRESHOLD = float(os.getenv("FACE_COSINE_THRESHOLD", "0.363"))

YUNET_URL  = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL  = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
YUNET_NAME = "face_detection_yunet_2023mar.onnx"
SFACE_NAME = "face_recognition_sface_2021dec.onnx"

# ─── Model singletons ─────────────────────────────────────────────────────────

_face_detector:   Optional[cv2.FaceDetectorYN]   = None
_face_recognizer: Optional[cv2.FaceRecognizerSF]  = None


def _ensure_model(url: str, name: str) -> str:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    path = MODEL_DIR / name
    if not path.exists():
        print(f"Downloading face model: {name} …")
        urllib.request.urlretrieve(url, str(path))
        print(f"Downloaded {name} ({path.stat().st_size // 1024} KB)")
    return str(path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _face_detector, _face_recognizer
    try:
        yunet_path = _ensure_model(YUNET_URL, YUNET_NAME)
        sface_path = _ensure_model(SFACE_URL, SFACE_NAME)
        _face_detector  = cv2.FaceDetectorYN.create(yunet_path, "", (320, 320))
        _face_recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
        print("Face recognition models loaded (YuNet + SFace)")
    except Exception as e:
        print(f"WARNING: Face models could not be loaded: {e}")
    yield


app = FastAPI(title="PKI Identity Document Validator", lifespan=lifespan)

# ─── Auth helper ──────────────────────────────────────────────────────────────

def _check_api_key(key: str) -> None:
    if REQUIRED_API_KEY and key != REQUIRED_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ─── OCR helpers (validation de document) ─────────────────────────────────────

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
    thr  = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
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

    label = "UNKNOWN"; accepted = False; confidence = 0.0
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

# ─── Face recognition helpers ─────────────────────────────────────────────────

def _extract_face_feature(image_bytes: bytes) -> np.ndarray:
    """Detect the best face in image_bytes and return its SFace embedding."""
    if _face_detector is None or _face_recognizer is None:
        raise RuntimeError("Face models not loaded")

    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Format d'image non supporté")

    h, w = img.shape[:2]
    _face_detector.setInputSize((w, h))
    _, faces = _face_detector.detect(img)

    if faces is None or len(faces) == 0:
        raise ValueError("Aucun visage détecté dans l'image")

    # Keep the face with the highest detection confidence
    best = max(faces, key=lambda f: float(f[-1]))
    aligned = _face_recognizer.alignCrop(img, best)
    return _face_recognizer.feature(aligned)

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "face_models": _face_detector is not None and _face_recognizer is not None,
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
    Utilise OpenCV SFace (cosine similarity, seuil 0.363).
    """
    _check_api_key(x_api_key)

    # Si les modèles ne sont pas chargés → mode souple, on laisse passer
    if _face_detector is None or _face_recognizer is None:
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
        doc_feat = _extract_face_feature(doc_raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Pièce d'identité: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        selfie_feat = _extract_face_feature(selfie_raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Selfie: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    cosine = float(_face_recognizer.match(doc_feat, selfie_feat, cv2.FaceRecognizerSF.FR_COSINE))
    match  = cosine > COSINE_THRESHOLD

    return {
        "match":      match,
        "similarity": round(cosine, 4),
        "message":    "Visages identiques" if match else "Le selfie ne correspond pas au visage sur la pièce d'identité",
    }
