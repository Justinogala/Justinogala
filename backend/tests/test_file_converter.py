"""
Test File Converter API - Tests for PDF/Image/Document format conversions
"""
import pytest
import requests
import os
import io
from PIL import Image
import fitz  # PyMuPDF

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestFileConverterSupported:
    """Tests for GET /api/converter/supported endpoint"""
    
    def test_get_supported_conversions(self):
        """Test that supported conversions endpoint returns 11 conversions"""
        response = requests.get(f"{BASE_URL}/api/converter/supported")
        assert response.status_code == 200
        
        data = response.json()
        assert "conversions" in data
        assert len(data["conversions"]) == 11
        
        # Verify all expected conversion types are present
        conversion_ids = [c["id"] for c in data["conversions"]]
        expected_ids = [
            "pdf-to-jpg", "pdf-to-png", "pdf-to-word",
            "word-to-pdf", "excel-to-pdf", "pptx-to-pdf",
            "jpg-to-pdf", "png-to-pdf", "image-to-pdf",
            "png-to-jpg", "jpg-to-png"
        ]
        for expected_id in expected_ids:
            assert expected_id in conversion_ids, f"Missing conversion: {expected_id}"
    
    def test_supported_conversions_structure(self):
        """Test that each conversion has required fields"""
        response = requests.get(f"{BASE_URL}/api/converter/supported")
        assert response.status_code == 200
        
        data = response.json()
        for conv in data["conversions"]:
            assert "id" in conv
            assert "from" in conv
            assert "to" in conv
            assert "category" in conv


class TestPDFToImageConversions:
    """Tests for PDF to image conversions"""
    
    @pytest.fixture
    def test_pdf(self):
        """Create a test PDF file"""
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(fitz.Point(72, 72), "Test PDF Content")
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes
    
    def test_pdf_to_jpg_conversion(self, test_pdf):
        """Test PDF to JPG conversion"""
        files = {"file": ("test.pdf", io.BytesIO(test_pdf), "application/pdf")}
        data = {"conversion_type": "pdf-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        # Verify response is an image
        content_type = response.headers.get("Content-Type", "")
        assert "image/jpeg" in content_type or "application/zip" in content_type
        
        # Verify content disposition header
        disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in disposition
    
    def test_pdf_to_png_conversion(self, test_pdf):
        """Test PDF to PNG conversion"""
        files = {"file": ("test.pdf", io.BytesIO(test_pdf), "application/pdf")}
        data = {"conversion_type": "pdf-to-png"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "image/png" in content_type or "application/zip" in content_type
    
    def test_pdf_to_word_conversion(self, test_pdf):
        """Test PDF to Word conversion"""
        files = {"file": ("test.pdf", io.BytesIO(test_pdf), "application/pdf")}
        data = {"conversion_type": "pdf-to-word"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in content_type
        
        # Verify filename in disposition
        disposition = response.headers.get("Content-Disposition", "")
        assert ".docx" in disposition


class TestImageConversions:
    """Tests for image format conversions"""
    
    @pytest.fixture
    def test_png(self):
        """Create a test PNG image"""
        img = Image.new("RGB", (200, 100), (100, 50, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.getvalue()
    
    @pytest.fixture
    def test_jpg(self):
        """Create a test JPG image"""
        img = Image.new("RGB", (200, 100), (50, 100, 200))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        return buf.getvalue()
    
    def test_png_to_jpg_conversion(self, test_png):
        """Test PNG to JPG conversion"""
        files = {"file": ("test.png", io.BytesIO(test_png), "image/png")}
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "image/jpeg" in content_type
        
        # Verify the output is a valid JPEG
        img = Image.open(io.BytesIO(response.content))
        assert img.format == "JPEG"
    
    def test_jpg_to_png_conversion(self, test_jpg):
        """Test JPG to PNG conversion"""
        files = {"file": ("test.jpg", io.BytesIO(test_jpg), "image/jpeg")}
        data = {"conversion_type": "jpg-to-png"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "image/png" in content_type
        
        # Verify the output is a valid PNG
        img = Image.open(io.BytesIO(response.content))
        assert img.format == "PNG"
    
    def test_image_to_pdf_conversion(self, test_png):
        """Test image to PDF conversion"""
        files = {"file": ("test.png", io.BytesIO(test_png), "image/png")}
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type
        
        # Verify the output is a valid PDF
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) >= 1
        doc.close()


class TestWordToPDFConversion:
    """Tests for Word to PDF conversion"""
    
    @pytest.fixture
    def test_docx(self):
        """Create a test DOCX file"""
        from docx import Document
        doc = Document()
        doc.add_heading("Test Document", 0)
        doc.add_paragraph("This is a test paragraph.")
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.getvalue()
    
    def test_word_to_pdf_conversion(self, test_docx):
        """Test Word to PDF conversion"""
        files = {"file": ("test.docx", io.BytesIO(test_docx), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {"conversion_type": "word-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type
        
        # Verify the output is a valid PDF
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) >= 1
        doc.close()


class TestErrorHandling:
    """Tests for error handling in converter API"""
    
    def test_unsupported_conversion_type(self):
        """Test that unsupported conversion type returns 400"""
        # Create a simple test file
        img = Image.new("RGB", (100, 100), (255, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        
        files = {"file": ("test.png", buf, "image/png")}
        data = {"conversion_type": "unsupported-type"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 400
        
        error_data = response.json()
        assert "detail" in error_data
        assert "unsupported" in error_data["detail"].lower()
    
    def test_missing_file(self):
        """Test that missing file returns error"""
        data = {"conversion_type": "pdf-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", data=data)
        assert response.status_code == 422  # Validation error
    
    def test_missing_conversion_type(self):
        """Test that missing conversion_type returns error"""
        img = Image.new("RGB", (100, 100), (255, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        
        files = {"file": ("test.png", buf, "image/png")}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files)
        assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
