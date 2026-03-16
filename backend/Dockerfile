FROM python:3.11-slim

# System deps needed by docTR (OpenCV, Pillow, etc.) — NO GTK
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY app/ ./app/
COPY sgat_layoutlm_model.pth ./sgat_layoutlm_model.pth
COPY .env.production ./.env 2>/dev/null || true

# WeasyPrint GTK fix is already in the code (sys.modules mock in main.py)
# Force PyTorch backend for docTR
ENV USE_TORCH=1
ENV DOCTR_BACKEND=pytorch
ENV DOCTR_CACHE_DIR=/tmp/.cache/doctr
ENV HF_HOME=/tmp/.cache/huggingface
ENV TRANSFORMERS_CACHE=/tmp/.cache/huggingface/hub

# Download docTR models at build time so first request is fast
RUN python -c "\
import sys; \
from unittest.mock import MagicMock as MM; \
[sys.modules.__setitem__(m, MM()) for m in ['weasyprint','weasyprint.fonts','weasyprint.document','weasyprint.css','weasyprint.svg','weasyprint.html','weasyprint.formatting_structure','weasyprint.stacking','weasyprint.layout','weasyprint.draw','weasyprint.text','weasyprint.text.ffi','weasyprint.text.line_break'] if m not in sys.modules]; \
import os; os.environ['USE_TORCH']='1'; os.environ['DOCTR_BACKEND']='pytorch'; \
from doctr.models import ocr_predictor; \
m = ocr_predictor(det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True); \
print('docTR models downloaded OK'); \
" || echo "docTR pre-download skipped (will download on first request)"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
