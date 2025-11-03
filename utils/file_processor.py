import os
from pathlib import Path
from typing import Dict, Optional
import tempfile

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document
except ImportError:
    Document = None

try:
    import markdown
except ImportError:
    markdown = None

class FileProcessor:

    @staticmethod
    def process_file(file_path: str) -> Dict:
        path = Path(file_path)
        file_extension = path.suffix.lower()

        result = {
            "file_type": file_extension.lstrip('.'),
            "file_size_bytes": path.stat().st_size,
            "content_text": None,
            "success": False,
            "error": None
        }

        try:
            if file_extension == '.txt':
                result["content_text"] = FileProcessor._process_txt(file_path)
                result["success"] = True

            elif file_extension == '.md':
                result["content_text"] = FileProcessor._process_markdown(file_path)
                result["success"] = True

            elif file_extension == '.pdf':
                result["content_text"] = FileProcessor._process_pdf(file_path)
                result["success"] = True

            elif file_extension in ['.docx', '.doc']:
                result["content_text"] = FileProcessor._process_docx(file_path)
                result["success"] = True

            else:
                result["error"] = f"Unsupported file type: {file_extension}"

        except Exception as e:
            result["error"] = str(e)

        return result

    @staticmethod
    def _process_txt(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    @staticmethod
    def _process_markdown(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            md_content = f.read()

        if markdown:
            html_content = markdown.markdown(md_content)
            return md_content
        else:
            return md_content

    @staticmethod
    def _process_pdf(file_path: str) -> str:
        if not PdfReader:
            raise ImportError("PyPDF2 is required to process PDF files. Install it with: pip install PyPDF2")

        reader = PdfReader(file_path)
        text_content = []

        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)

        return "\n\n".join(text_content)

    @staticmethod
    def _process_docx(file_path: str) -> str:
        if not Document:
            raise ImportError("python-docx is required to process Word documents. Install it with: pip install python-docx")

        doc = Document(file_path)
        text_content = []

        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_content.append(paragraph.text)

        return "\n\n".join(text_content)

    @staticmethod
    def save_uploaded_file(file_data: bytes, filename: str, upload_dir: str = "uploads") -> str:
        upload_path = Path(upload_dir)
        upload_path.mkdir(parents=True, exist_ok=True)

        file_path = upload_path / filename
        counter = 1

        while file_path.exists():
            name_parts = filename.rsplit('.', 1)
            if len(name_parts) == 2:
                file_path = upload_path / f"{name_parts[0]}_{counter}.{name_parts[1]}"
            else:
                file_path = upload_path / f"{filename}_{counter}"
            counter += 1

        with open(file_path, 'wb') as f:
            f.write(file_data)

        return str(file_path)

    @staticmethod
    def get_file_metadata(file_path: str) -> Dict:
        path = Path(file_path)

        if not path.exists():
            return {"error": "File not found"}

        return {
            "filename": path.name,
            "file_type": path.suffix.lstrip('.'),
            "file_size_bytes": path.stat().st_size,
            "created_at": path.stat().st_ctime,
            "modified_at": path.stat().st_mtime
        }

    @staticmethod
    def supported_file_types() -> list:
        return ['txt', 'md', 'pdf', 'docx', 'doc']
