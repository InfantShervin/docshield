"""
OCR Service — handles every input type:
- Scanned images (JPG, PNG, TIFF, BMP, WEBP)
- Printed document photos
- Digital/computer-generated images
- PDFs (scanned or digital)
"""
import os
import tempfile
from typing import List, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np


def preprocess_image(image: Image.Image) -> Image.Image:
    """Enhance image quality for better OCR accuracy."""
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
    """Normalize bounding box to 0-1000 scale — exact from notebook."""
    x0 = max(0, min(1000, int(1000 * box[0] / width)))
    y0 = max(0, min(1000, int(1000 * box[1] / height)))
    x1 = max(0, min(1000, int(1000 * box[2] / width)))
    y1 = max(0, min(1000, int(1000 * box[3] / height)))
    return [x0, y0, x1, y1]


def run_doctr_ocr(image: Image.Image) -> Tuple[List[str], List[List[int]]]:
    """Run docTR neural OCR on a PIL image."""
    from doctr.models import ocr_predictor
    from doctr.io import DocumentFile

    tokens, boxes = [], []
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        image.save(tmp.name, format="PNG")
        tmp_path = tmp.name
    try:
        model = ocr_predictor(pretrained=True)
        doc = DocumentFile.from_images(tmp_path)
        result = model(doc)
        for page in result.pages:
            for block in page.blocks:
                for line in block.lines:
                    for word in line.words:
                        if word.value.strip():
                            tokens.append(word.value.strip())
                            x1, y1 = word.geometry[0]
                            x2, y2 = word.geometry[1]
                            boxes.append([
                                max(0, min(1000, int(x1 * 1000))),
                                max(0, min(1000, int(y1 * 1000))),
                                max(0, min(1000, int(x2 * 1000))),
                                max(0, min(1000, int(y2 * 1000))),
                            ])
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
    return tokens, boxes


def run_ocr_on_image(image: Image.Image) -> Tuple[List[str], List[List[int]]]:
    """Main OCR entry point for a single PIL Image."""
    try:
        image = preprocess_image(image)
        tokens, boxes = run_doctr_ocr(image)
        if not tokens:
            import cv2
            img_np = np.array(image.convert("L"))
            _, thresh = cv2.threshold(img_np, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            image = Image.fromarray(thresh).convert("RGB")
            tokens, boxes = run_doctr_ocr(image)
        return tokens, boxes
    except Exception as e:
        print(f"[OCR ERROR] {e}")
        return [], []


def pdf_to_images(pdf_bytes: bytes) -> List[Image.Image]:
    """Convert PDF pages to list of PIL Images."""
    try:
        from pdf2image import convert_from_bytes
        return convert_from_bytes(pdf_bytes, dpi=200)
    except Exception as e:
        print(f"[PDF→IMG ERROR] {e}")
        return []


def extract_pdf_text_direct(pdf_bytes: bytes) -> Tuple[List[str], List[List[int]]]:
    """Extract text directly from digital PDFs using pypdf."""
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        tokens, boxes = [], []
        for page in reader.pages:
            text = page.extract_text() or ""
            words = text.split()
            for i, word in enumerate(words):
                tokens.append(word)
                col = i % 10
                row = i // 10
                x0 = int((col / 10) * 900)
                y0 = int((row / 50) * 900) % 1000
                boxes.append([x0, y0, min(1000, x0 + 80), min(1000, y0 + 20)])
        return tokens, boxes
    except Exception as e:
        print(f"[PDF TEXT ERROR] {e}")
        return [], []


def run_ocr_on_pdf(pdf_bytes: bytes) -> Tuple[List[str], List[List[int]]]:
    """Full PDF pipeline — tries image OCR first, then direct text extraction."""
    images = pdf_to_images(pdf_bytes)
    if images:
        all_tokens, all_boxes = [], []
        for img in images[:5]:
            t, b = run_ocr_on_image(img)
            all_tokens.extend(t)
            all_boxes.extend(b)
        if all_tokens:
            return all_tokens, all_boxes
    return extract_pdf_text_direct(pdf_bytes)