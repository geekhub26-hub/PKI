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

MAX_FILE_SIZE       = int(os.getenv("AI_MAX_FILE_SIZE_BYTES", str(10 * 1024 * 1024)))
REQUIRED_API_KEY    = os.getenv("LOCAL_AI_API_KEY", "").strip()
MODEL_DIR           = Path(os.getenv("MODEL_DIR", "/tmp/pki-models"))
COSINE_THRESHOLD    = float(os.getenv("FACE_COSINE_THRESHOLD", "0.38"))
MIN_FACE_AREA_RATIO = float(os.getenv("MIN_FACE_AREA_RATIO", "0.03"))
MAX_FACE_DIM        = int(os.getenv("MAX_FACE_DIM", "1024"))   # cap images before face processing
MAX_OCR_DIM         = int(os.getenv("MAX_OCR_DIM", "2000"))    # cap images before OCR

# Limit OpenCV thread pool — reduces idle + peak memory on constrained hosts
cv2.setNumThreads(2)

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


def _shrink(img: np.ndarray, max_dim: int) -> np.ndarray:
    h, w = img.shape[:2]
    if max(h, w) <= max_dim:
        return img
    scale = max_dim / max(h, w)
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


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
    del arr
    if image is None:
        raise ValueError("Unsupported image format")
    image = _shrink(image, MAX_OCR_DIM)
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


_GENERIC_PHOTO_NAMES = (
    "pxl_", "img_", "dsc_", "dcim", "photo", "scan", "raw",
    "cover", "image", "screenshot", "capture", "document",
)

def _classify(text: str, filename: str, expected_type: str, ocr_text_length: int = 0) -> Dict:
    cni_score = 0
    passport_score = 0

    fn = filename.lower()

    # ── Nom de fichier ───────────────────────────────────────────────────────
    if _contains_any(fn, ("cni", "identite", "identity", "id_card", "national_id", "carte")):
        cni_score += 2
    if _contains_any(fn, ("passport", "passeport", "mrz")):
        passport_score += 2

    # Nom générique de smartphone (PXL_, IMG_, raw, cover…) — impossible à classifier
    # par le nom seul → score neutre 1 sur le type attendu pour que le fallback s'active
    is_generic = _contains_any(fn, _GENERIC_PHOTO_NAMES)
    if is_generic:
        if expected_type == "CNI":
            cni_score = max(cni_score, 1)
        elif expected_type in {"PASSEPORT", "PASSPORT"}:
            passport_score = max(passport_score, 1)

    # ── Texte OCR : CNI ──────────────────────────────────────────────────────
    cni_keywords = (
        "carte nationale", "carte d'identite", "national identity card",
        "national identity", "identity card", "id card",
        "numero cni", "numero oni", "nic number",
        "date de naissance", "date of birth",
        "date de delivrance", "date of issue",
        "republique du cameroun", "republic of cameroon",
    )
    if _contains_any(text, cni_keywords):
        cni_score += 4

    # MRZ TD1 (CNI) — commence par I< (ex. I<CMR pour Cameroun)
    if re.search(r"i<[a-z]{3}", text) or "i<cmr" in text:
        cni_score += 3

    # ── Texte OCR : Passeport ────────────────────────────────────────────────
    if _contains_any(text, ("passport", "passeport", "travel document", "nationality", "date of expiry")):
        passport_score += 4

    # MRZ TD3 (passeport) — commence par P<
    if re.search(r"p<[a-z]{3}", text) or "p<" in text:
        passport_score += 2
    if re.search(r"[a-z0-9<]{25,}", text):
        passport_score += 1

    cni_conf  = min(1.0, cni_score / 7.0)
    pass_conf = min(1.0, passport_score / 7.0)

    label      = "UNKNOWN"
    accepted   = False
    confidence = 0.0
    message    = "Document d'identite non detecte"

    # ── Cas spécial : nom générique + OCR insuffisant + aucun indice passeport
    # → impossible de conclure heuristiquement → on accepte avec faible confiance
    # (le soft mode côté Java est déjà activé si le service est DOWN ; ici on
    #  retourne accepted=True directement pour les images non identifiables)
    if is_generic and ocr_text_length < 80 and passport_score == 0 and expected_type:
        return {
            "accepted":       True,
            "confidence":     0.1,
            "label":          expected_type,
            "message":        "Analyse heuristique incertaine (nom générique, OCR insuffisant) — accepté en mode souple",
            "scores":         {"cni": cni_score, "passport": passport_score},
        }

    if expected_type == "CNI":
        accepted   = cni_score >= 3 and cni_score >= passport_score
        confidence = cni_conf
        label      = "CNI" if accepted else "UNKNOWN"
        message    = "CNI detectee" if accepted else "Le document ne ressemble pas a une CNI"
    elif expected_type in {"PASSEPORT", "PASSPORT"}:
        accepted   = passport_score >= 3 and passport_score >= cni_score
        confidence = pass_conf
        label      = "PASSEPORT" if accepted else "UNKNOWN"
        message    = "Passeport detecte" if accepted else "Le document ne ressemble pas a un passeport"
    else:
        if cni_score >= passport_score and cni_score >= 3:
            accepted, confidence, label, message = True, cni_conf, "CNI", "Document d'identite detecte: CNI"
        elif passport_score >= 3:
            accepted, confidence, label, message = True, pass_conf, "PASSEPORT", "Document d'identite detecte: PASSEPORT"

    return {
        "accepted":   accepted,
        "confidence": round(float(confidence), 3),
        "label":      label,
        "message":    message,
        "scores":     {"cni": cni_score, "passport": passport_score},
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
    del arr
    if img is None:
        raise ValueError("Format d'image non supporté")

    img = _shrink(img, MAX_FACE_DIM)
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
    ocr_len = len(text)
    result = _classify(
        text=text,
        filename=file.filename.lower(),
        expected_type=(expectedType or "").strip().upper(),
        ocr_text_length=ocr_len,
    )
    result["ocrTextLength"] = ocr_len
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
