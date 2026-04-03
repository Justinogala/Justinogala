"""
Test Batch File Converter API - Tests for batch conversion feature
Features tested:
- POST /api/converter/batch-convert with multiple images + image-to-pdf returns merged PDF
- POST /api/converter/batch-convert with multiple PNGs + png-to-jpg returns ZIP with JPGs
- Max 50 files validation
- Unsupported conversion type returns 400
- Single file conversion regression test
"""
import pytest
import requests
import os
import io
import zipfile
from PIL import Image
import fitz  # PyMuPDF

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestBatchImageToPDFMerge:
    """Tests for batch image→PDF merge (returns single combined PDF)"""
    
    @pytest.fixture
    def test_images(self):
        """Create 3 test PNG images with different colors"""
        images = []
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]  # Red, Green, Blue
        for i, color in enumerate(colors):
            img = Image.new("RGB", (200, 150), color)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            images.append((f"test_image_{i+1}.png", buf.getvalue()))
        return images
    
    def test_batch_images_to_pdf_returns_merged_pdf(self, test_images):
        """Test batch image-to-pdf returns a single merged PDF with N pages"""
        files = [("files", (name, io.BytesIO(data), "image/png")) for name, data in test_images]
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 200, f"Batch conversion failed: {response.text}"
        
        # Verify content type is PDF
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected PDF, got {content_type}"
        
        # Verify it's a valid PDF with 3 pages (one per image)
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) == 3, f"Expected 3 pages in merged PDF, got {len(doc)}"
        doc.close()
        
        # Verify filename
        disposition = response.headers.get("Content-Disposition", "")
        assert "combined.pdf" in disposition, f"Expected combined.pdf, got {disposition}"
    
    def test_batch_jpg_to_pdf_merge(self):
        """Test batch jpg-to-pdf also merges into single PDF"""
        images = []
        for i in range(2):
            img = Image.new("RGB", (100, 100), (100 + i*50, 50, 150))
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            buf.seek(0)
            images.append((f"test_{i}.jpg", buf.getvalue()))
        
        files = [("files", (name, io.BytesIO(data), "image/jpeg")) for name, data in images]
        data = {"conversion_type": "jpg-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 200
        
        # Verify merged PDF
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) == 2, f"Expected 2 pages, got {len(doc)}"
        doc.close()
    
    def test_batch_png_to_pdf_merge(self):
        """Test batch png-to-pdf also merges into single PDF"""
        images = []
        for i in range(4):
            img = Image.new("RGB", (80, 80), (i*50, i*30, 200))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            images.append((f"img_{i}.png", buf.getvalue()))
        
        files = [("files", (name, io.BytesIO(data), "image/png")) for name, data in images]
        data = {"conversion_type": "png-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 200
        
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) == 4, f"Expected 4 pages, got {len(doc)}"
        doc.close()


class TestBatchIndividualConversion:
    """Tests for batch conversions that return ZIP (non-merge types)"""
    
    @pytest.fixture
    def test_pngs(self):
        """Create 3 test PNG images"""
        images = []
        for i in range(3):
            img = Image.new("RGB", (100, 100), (50 + i*50, 100, 150))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            images.append((f"image_{i+1}.png", buf.getvalue()))
        return images
    
    def test_batch_png_to_jpg_returns_zip(self, test_pngs):
        """Test batch png-to-jpg returns ZIP with N JPG files"""
        files = [("files", (name, io.BytesIO(data), "image/png")) for name, data in test_pngs]
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 200, f"Batch conversion failed: {response.text}"
        
        # Verify content type is ZIP
        content_type = response.headers.get("Content-Type", "")
        assert "application/zip" in content_type, f"Expected ZIP, got {content_type}"
        
        # Verify ZIP contains 3 JPG files
        zip_buf = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buf, 'r') as zf:
            names = zf.namelist()
            assert len(names) == 3, f"Expected 3 files in ZIP, got {len(names)}: {names}"
            for name in names:
                assert name.endswith('.jpg'), f"Expected .jpg file, got {name}"
                # Verify each file is a valid JPEG
                img_data = zf.read(name)
                img = Image.open(io.BytesIO(img_data))
                assert img.format == "JPEG"
    
    def test_batch_jpg_to_png_returns_zip(self):
        """Test batch jpg-to-png returns ZIP with N PNG files"""
        images = []
        for i in range(2):
            img = Image.new("RGB", (80, 80), (200, 100 + i*50, 50))
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            buf.seek(0)
            images.append((f"photo_{i}.jpg", buf.getvalue()))
        
        files = [("files", (name, io.BytesIO(data), "image/jpeg")) for name, data in images]
        data = {"conversion_type": "jpg-to-png"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 200
        
        zip_buf = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buf, 'r') as zf:
            names = zf.namelist()
            assert len(names) == 2, f"Expected 2 files, got {len(names)}"
            for name in names:
                assert name.endswith('.png'), f"Expected .png file, got {name}"


class TestBatchPDFConversions:
    """Tests for batch PDF conversions"""
    
    @pytest.fixture
    def test_pdfs(self):
        """Create 2 test PDF files"""
        pdfs = []
        for i in range(2):
            doc = fitz.open()
            page = doc.new_page()
            page.insert_text(fitz.Point(72, 72), f"Test PDF {i+1}")
            pdf_bytes = doc.tobytes()
            doc.close()
            pdfs.append((f"document_{i+1}.pdf", pdf_bytes))
        return pdfs
    
    def test_batch_pdf_to_jpg_returns_zip(self, test_pdfs):
        """Test batch pdf-to-jpg returns ZIP with images"""
        files = [("files", (name, io.BytesIO(data), "application/pdf")) for name, data in test_pdfs]
        data = {"conversion_type": "pdf-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "application/zip" in content_type
        
        zip_buf = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buf, 'r') as zf:
            names = zf.namelist()
            # Each single-page PDF produces one JPG
            assert len(names) >= 2, f"Expected at least 2 images, got {len(names)}"
            for name in names:
                assert name.endswith('.jpg'), f"Expected .jpg, got {name}"


class TestBatchValidation:
    """Tests for batch conversion validation"""
    
    def test_batch_max_50_files_validation(self):
        """Test that batch rejects more than 50 files"""
        # Create 51 small images
        files = []
        for i in range(51):
            img = Image.new("RGB", (10, 10), (i % 256, 0, 0))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            files.append(("files", (f"img_{i}.png", buf, "image/png")))
        
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        error = response.json()
        assert "50" in error.get("detail", ""), f"Expected max 50 files error, got {error}"
    
    def test_batch_unsupported_conversion_type(self):
        """Test that batch rejects unsupported conversion types"""
        img = Image.new("RGB", (50, 50), (100, 100, 100))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        
        files = [("files", ("test.png", buf, "image/png"))]
        data = {"conversion_type": "invalid-conversion-type"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data)
        assert response.status_code == 400
        
        error = response.json()
        assert "unsupported" in error.get("detail", "").lower() or "invalid" in error.get("detail", "").lower()
    
    def test_batch_no_files_provided(self):
        """Test that batch rejects empty file list"""
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", data=data)
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"


class TestSingleFileConversionRegression:
    """Regression tests to ensure single file conversion still works"""
    
    def test_single_file_convert_endpoint_still_works(self):
        """Test that POST /api/converter/convert still works for single file"""
        img = Image.new("RGB", (100, 100), (200, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        
        files = {"file": ("test.png", buf, "image/png")}
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200, f"Single file conversion failed: {response.text}"
        
        content_type = response.headers.get("Content-Type", "")
        assert "image/jpeg" in content_type
        
        # Verify output is valid JPEG
        img = Image.open(io.BytesIO(response.content))
        assert img.format == "JPEG"
    
    def test_single_image_to_pdf_still_works(self):
        """Test single image-to-pdf conversion"""
        img = Image.new("RGB", (150, 100), (50, 150, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        
        files = {"file": ("single.png", buf, "image/png")}
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type
        
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) == 1
        doc.close()
    
    def test_single_pdf_to_jpg_still_works(self):
        """Test single pdf-to-jpg conversion"""
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(fitz.Point(72, 72), "Single PDF Test")
        pdf_bytes = doc.tobytes()
        doc.close()
        
        files = {"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        data = {"conversion_type": "pdf-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        # Single page PDF returns single image
        assert "image/jpeg" in content_type or "application/zip" in content_type


class TestBatchEdgeCases:
    """Edge case tests for batch conversion"""
    
    def test_batch_with_exactly_50_files(self):
        """Test batch with exactly 50 files (should succeed)"""
        files = []
        for i in range(50):
            img = Image.new("RGB", (10, 10), (i % 256, (i*2) % 256, (i*3) % 256))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            files.append(("files", (f"img_{i}.png", buf, "image/png")))
        
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data, timeout=60)
        assert response.status_code == 200, f"50 files batch failed: {response.text}"
        
        # Verify merged PDF has 50 pages
        doc = fitz.open(stream=response.content, filetype="pdf")
        assert len(doc) == 50, f"Expected 50 pages, got {len(doc)}"
        doc.close()
    
    def test_batch_with_2_files_minimum(self):
        """Test batch with minimum 2 files"""
        images = []
        for i in range(2):
            img = Image.new("RGB", (50, 50), (100, 100, 100))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            images.append(("files", (f"img_{i}.png", buf, "image/png")))
        
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=images, data=data)
        assert response.status_code == 200
        
        # Should return ZIP
        content_type = response.headers.get("Content-Type", "")
        assert "application/zip" in content_type


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
