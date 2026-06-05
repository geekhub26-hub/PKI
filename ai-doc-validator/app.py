import os
import re
from typing import Dict, Tuple

import cv2
import numpy as np
import pytesseract
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile


app = FastAPI(title="PKI Identity Document Validator")

MAX_FILE_SIZE = int(os.getenv("AI_MAX_FILE_SIZE_BYTES", str(20 * 1024 * 1024)))
REQUIRED_API_KEY = os.getenv("LOCAL_AI_API_KEY", "").strip()


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

    # Signature MRZ (passports): P< + lignes à forte densité de chevrons/alphanum.
    if "p<" in text:
        passport_score += 2
    if re.search(r"[a-z0-9<]{25,}", text):
        passport_score += 1

    cni_conf = min(1.0, cni_score / 7.0)
    pass_conf = min(1.0, passport_score / 7.0)

    label = "UNKNOWN"
    accepted = False
    confidence = 0.0
    message = "Document d'identite non detecte"

    if expected_type == "CNI":
        accepted = cni_score >= 4 and cni_score >= passport_score
        confidence = cni_conf
        label = "CNI" if accepted else "UNKNOWN"
        message = "CNI detectee" if accepted else "Le document ne ressemble pas a une CNI"
    elif expected_type in {"PASSEPORT", "PASSPORT"}:
        accepted = passport_score >= 4 and passport_score >= cni_score
        confidence = pass_conf
        label = "PASSEPORT" if accepted else "UNKNOWN"
        message = "Passeport detecte" if accepted else "Le document ne ressemble pas a un passeport"
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/validate")
async def validate_document(
    file: UploadFile = File(...),
    expectedType: str = Form(default=""),
    x_api_key: str = Header(default=""),
):
    if REQUIRED_API_KEY and x_api_key != REQUIRED_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

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
