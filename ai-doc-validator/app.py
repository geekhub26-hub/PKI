import os
import re
import time
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import pytesseract
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

# ─── Config ───────────────────────────────────────────────────────────────────

MAX_FILE_SIZE       = int(os.getenv("AI_MAX_FILE_SIZE_BYTES", str(20 * 1024 * 1024)))
REQUIRED_API_KEY    = os.getenv("LOCAL_AI_API_KEY", "").strip()
MODEL_DIR           = Path(os.getenv("MODEL_DIR", "/tmp/pki-models"))
COSINE_THRESHOLD    = float(os.getenv("FACE_COSINE_THRESHOLD", "0.38"))
MIN_FACE_AREA_RATIO = float(os.getenv("MIN_FACE_AREA_RATIO", "0.03"))

YUNET_NAME = "face_detection_yunet_2023mar.onnx"
SFACE_NAME = "face_recognition_sface_2021dec.onnx"
YUNET_URLS: List[str] = [
    "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    "https://cdn.jsdelivr.net/gh/opencv/opencv_zoo@main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
]
SFACE_URLS: List[str] = [
    "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
    "https://cdn.jsdelivr.net/gh/opencv/opencv_zoo@main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
]

# ─── Model singletons ─────────────────────────────────────────────────────────

_face_detector:   Optional[cv2.FaceDetectorYN]  = None
_face_recognizer: Optional[cv2.FaceRecognizerSF] = None

_HEADERS = {"User-Agent": "PKI-Validator/1.0 (face-models-download)"}


def _download_bytes(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _ensure_model(urls: List[str], name: str, min_kb: int = 50) -> str:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    path = MODEL_DIR / name
    if path.exists() and path.stat().st_size >= min_kb * 1024:
        return str(path)
    if path.exists():
        path.unlink()
    last_err: Optional[Exception] = None
    for url in urls:
        for attempt in range(1, 3):
            try:
                print(f"[attempt {attempt}/2] Downloading {name} from {url} …")
                data = _download_bytes(url)
                if len(data) < min_kb * 1024:
                    raise ValueError(f"File too small ({len(data)} bytes)")
                path.write_bytes(data)
                print(f"Downloaded {name} ({path.stat().st_size // 1024} KB)")
                return str(path)
            except Exception as e:
                last_err = e
                print(f"Failed ({name}, attempt {attempt}): {e}")
                if attempt < 2:
                    time.sleep(5)
    raise RuntimeError(f"Could not download {name}: {last_err}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _face_detector, _face_recognizer
    try:
        yunet_path = _ensure_model(YUNET_URLS, YUNET_NAME)
        sface_path = _ensure_model(SFACE_URLS, SFACE_NAME)
        _face_detector  = cv2.FaceDetectorYN.create(yunet_path, "", (320, 320))
        _face_recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
        print("Face models loaded: YuNet + SFace (OpenCV)")
    except Exception as e:
        print(f"WARNING: Face models could not be loaded: {e}")
    yield


app = FastAPI(title="PKI Identity Document Validator", lifespan=lifespan)

# ─── Auth ─────────────────────────────────────────────────────────────────────


def _check_api_key(key: str) -> None:
    if REQUIRED_API_KEY and key != REQUIRED_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ─── OCR helpers ──────────────────────────────────────────────────────────────


def _contains_any(text: str, keys: Tuple[str, ...]) -> bool:
    return any(k in text for k in keys)


def _normalize_text(text: str) -> str:
    text = text.lower().replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def _extract_ocr_text(raw: bytes) -> str:
    arr = np.frombuffer(raw, np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unsupported image format")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
    try:
        text = pytesseract.image_to_string(thr, lang="eng+fra", config="--oem 3 --psm 6")
        if not text.strip():
            text = pytesseract.image_to_string(gray, lang="eng+fra", config="--oem 3 --psm 6")
        return _normalize_text(text)
    except Exception:
        return ""  # tesseract not available → filename-only classification


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
    """CLAHE + sharpening for document headshots."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    return cv2.filter2D(enhanced, -1, kernel)


def _detect_best_face(img: np.ndarray) -> Optional[np.ndarray]:
    h, w = img.shape[:2]
    _face_detector.setInputSize((w, h))
    _, faces = _face_detector.detect(img)
    if faces is None or len(faces) == 0:
        return None
    return max(faces, key=lambda f: float(f[2]) * float(f[3]))


def _extract_embedding(image_bytes: bytes, label: str, document: bool = False) -> np.ndarray:
    if _face_detector is None or _face_recognizer is None:
        raise RuntimeError("Modèles de reconnaissance faciale non disponibles")

    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Format d'image non supporté")

    img_area = img.shape[0] * img.shape[1]

    best = _detect_best_face(_enhance_document(img) if document else img)
    if best is None and document:
        best = _detect_best_face(img)
    if best is None:
        raise ValueError(f"Aucun visage détecté dans {label}")

    face_area = float(best[2]) * float(best[3])
    if not document and (face_area / img_area) < MIN_FACE_AREA_RATIO:
        raise ValueError(
            "Visage trop loin de la caméra — rapprochez-vous et centrez votre visage dans l'ovale"
        )

    aligned = _face_recognizer.alignCrop(img, best)
    return _face_recognizer.feature(aligned)

# ─── Endpoints ────────────────────────────────────────────────────────────────


@app.get("/")
def root():
    return {"service": "PKI AI Validator", "status": "ok"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "face_models": _face_detector is not None and _face_recognizer is not None,
        "recognition": "SFace (OpenCV)",
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
    if not (file.content_type or "").lower().startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")
    try:
        text = _extract_ocr_text(raw)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
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
    _check_api_key(x_api_key)

    if _face_detector is None or _face_recognizer is None:
        raise HTTPException(
            status_code=503,
            detail="Service de reconnaissance faciale non disponible — réessayez dans quelques secondes",
        )

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

    cosine = float(_face_recognizer.match(doc_emb, selfie_emb, cv2.FaceRecognizerSF.FR_COSINE))
    match  = cosine >= COSINE_THRESHOLD

    return {
        "match":      match,
        "similarity": round(cosine, 4),
        "message":    "Visages identiques" if match else "Le selfie ne correspond pas au visage sur la pièce d'identité",
    }
