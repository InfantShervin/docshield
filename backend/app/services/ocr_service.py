import os
import sys
import tempfile
from typing import List, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

# ── Windows / WeasyPrint GTK fix ──────────────────────────────────────────────
# docTR depends on WeasyPrint which crashes on Windows (GTK DLL missing).
# We mock WeasyPrint before docTR is ever imported so it loads cleanly.
# DocShield never uses doctr.io.read_html(), so this mock is completely safe.
from unittest.mock import MagicMock as _MM
for _m in ["weasyprint", "weasyprint.fonts", "weasyprint.document",
           "weasyprint.css", "weasyprint.svg", "weasyprint.html",
           "weasyprint.formatting_structure", "weasyprint.stacking",
           "weasyprint.layout", "weasyprint.draw", "weasyprint.text",
           "weasyprint.text.ffi", "weasyprint.text.line_break"]:
    if _m not in sys.modules:
        sys.modules[_m] = _MM()

# Force docTR to use the PyTorch backend (not TensorFlow)
os.environ.setdefault("USE_TORCH", "1")
os.environ.setdefault("DOCTR_BACKEND", "pytorch")
os.environ.setdefault("DOCTR_CACHE_DIR", os.path.join(os.path.expanduser("~"), ".cache", "doctr"))
# ──────────────────────────────────────────────────────────────────────────────

def preprocess_image(image: Image.Image) -> Image.Image:
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.filter(ImageFilter.SHARPEN)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.3)
    w, h = image.size
    if w < 800 or h < 800:
        scale = max(800 / w, 800 / h)
        image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return image


def normalize_bbox(box: List[int], width: int, height: int) -> List[int]:
    x0 = max(0, min(1000, int(1000 * box[0] / width)))
    y0 = max(0, min(1000, int(1000 * box[1] / height)))
    x1 = max(0, min(1000, int(1000 * box[2] / width)))
    y1 = max(0, min(1000, int(1000 * box[3] / height)))
    return [x0, y0, x1, y1]


def run_doctr_ocr(image: Image.Image) -> Tuple[List[str], List[List[int]]]:
    """Run docTR OCR — pure neural network, no Tesseract needed."""
    import os
    os.environ["USE_TORCH"] = "1"
    from doctr.models import ocr_predictor
    from doctr.io import DocumentFile

    tokens, boxes = [], []
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        image.save(tmp.name, format="PNG")
        tmp_path = tmp.name
    try:
        model = ocr_predictor(
            det_arch="db_resnet50",
            reco_arch="crnn_vgg16_bn",
            pretrained=True,
            assume_straight_pages=True,
        )
        doc = DocumentFile.from_images(tmp_path)
        result = model(doc)
        for page in result.pages:
            h, w = page.dimensions
            for block in page.blocks:
                for line in block.lines:
                    for word in line.words:
                        if word.value.strip():
                            tokens.append(word.value.strip())
                            x1 = int(word.geometry[0][0] * 1000)
                            y1 = int(word.geometry[0][1] * 1000)
                            x2 = int(word.geometry[1][0] * 1000)
                            y2 = int(word.geometry[1][1] * 1000)
                            boxes.append([
                                max(0, min(1000, x1)),
                                max(0, min(1000, y1)),
                                max(0, min(1000, x2)),
                                max(0, min(1000, y2)),
                            ])
    except Exception as e:
        print(f"[docTR ERROR] {e}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
    return tokens, boxes


def run_ocr_on_image(image: Image.Image) -> Tuple[List[str], List[List[int]]]:
    try:
        image = preprocess_image(image)
        tokens, boxes = run_doctr_ocr(image)
        return tokens, boxes
    except Exception as e:
        print(f"[OCR ERROR] {e}")
        return [], []


def pdf_to_images(pdf_bytes: bytes) -> List[Image.Image]:
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(
            pdf_bytes,
            dpi=200,
            poppler_path=r"C:\poppler\poppler-24.08.0\Library\bin"
        )
        return images
    except Exception as e:
        print(f"[PDF->IMG ERROR] {e}")
        return []


def extract_pdf_text_direct(pdf_bytes: bytes) -> Tuple[List[str], List[List[int]]]:
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        tokens, boxes = [], []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            words = text.split()
            for i, word in enumerate(words):
                if word.strip():
                    tokens.append(word.strip())
                    col = i % 10
                    row = i // 10
                    x0 = int((col / 10) * 900)
                    y0 = int((row / 50) * 900) % 1000
                    boxes.append([x0, y0, min(1000, x0+80), min(1000, y0+20)])
        return tokens, boxes
    except Exception as e:
        print(f"[PDF TEXT ERROR] {e}")
        return [], []


def run_ocr_on_pdf(pdf_bytes: bytes) -> Tuple[List[str], List[List[int]]]:
    """Try image OCR first, fall back to direct text extraction."""
    print("[PDF] Converting pages to images...")
    images = pdf_to_images(pdf_bytes)
    if images:
        print(f"[PDF] Got {len(images)} pages, running OCR...")
        all_tokens, all_boxes = [], []
        for i, img in enumerate(images[:5]):
            print(f"[PDF] OCR page {i+1}...")
            t, b = run_ocr_on_image(img)
            all_tokens.extend(t)
            all_boxes.extend(b)
        if all_tokens:
            print(f"[PDF] Extracted {len(all_tokens)} tokens via image OCR")
            return all_tokens, all_boxes
    print("[PDF] Falling back to direct text extraction...")
    return extract_pdf_text_direct(pdf_bytes)