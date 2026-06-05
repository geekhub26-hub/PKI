# Local AI Document Validator (Free)

Ce service valide gratuitement les pieces d'identite (CNI/passeport) avec OCR local.

## 1) Prerequis

- Python 3.11+
- Tesseract OCR installe sur la machine
  - Windows: installer Tesseract et ajouter le binaire dans `PATH`
  - Linux: `sudo apt-get install tesseract-ocr`

## 2) Installation

```bash
cd ai-doc-validator
python -m venv .venv
.venv\Scripts\activate      # Windows PowerShell
pip install -r requirements.txt
```

## 3) Lancement

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Optionnel:

- `LOCAL_AI_API_KEY=...` pour proteger l'endpoint
- `AI_MAX_FILE_SIZE_BYTES=20971520` pour limiter la taille des fichiers

## 4) Configuration backend

Dans Render (backend Java):

- `PKI_ID_AI_PROVIDER=local`
- `PKI_ID_AI_LOCAL_URL=http://<host-local-ai>:8000/validate`
- `PKI_ID_AI_LOCAL_API_KEY=<meme_cle_que_LOCAL_AI_API_KEY>` (si activee)
- `PKI_ID_AI_STRICT_MODE=true` (recommande)

## 5) Endpoint

- `POST /validate` en `multipart/form-data`
  - `file`: image
  - `expectedType`: `CNI` ou `PASSEPORT` (optionnel)

Reponse JSON:

```json
{
  "accepted": true,
  "confidence": 0.83,
  "label": "CNI",
  "message": "CNI detectee",
  "scores": { "cni": 6, "passport": 1 },
  "ocrTextLength": 482
}
```
