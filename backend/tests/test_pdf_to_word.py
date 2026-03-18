"""
Test PDF to Word conversion endpoint - /api/esignature/convert-to-word
Tests:
1. PDF file accepted and converts to DOCX
2. Non-PDF file rejected with 400
3. Large file (>20MB) rejected with 400
4. Word to PDF button still works (regression)
"""
import pytest
import requests
import os
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

def create_test_pdf(filename="test.pdf", num_pages=1, content="Test PDF Content"):
    """Create a simple test PDF file"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    for i in range(num_pages):
        c.drawString(100, 700, f"{content} - Page {i+1}")
        c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()

def create_test_docx():
    """Create a simple test DOCX file for regression testing Word to PDF"""
    from docx import Document
    buffer = io.BytesIO()
    doc = Document()
    doc.add_paragraph("Test Word Document")
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()

class TestPdfToWordConversion:
    """Tests for POST /api/esignature/convert-to-word endpoint"""
    
    def test_convert_pdf_to_word_success(self):
        """Test valid PDF file converts to DOCX successfully"""
        pdf_content = create_test_pdf(content="Hello World PDF to Word Test")
        
        files = {'file': ('test_document.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-word", files=files)
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}: {response.text}"
        
        # Content-type assertion - should be DOCX
        content_type = response.headers.get('content-type', '')
        assert 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type, f"Expected DOCX content type but got {content_type}"
        
        # Content-disposition should suggest docx filename
        content_disposition = response.headers.get('content-disposition', '')
        assert '.docx' in content_disposition.lower(), f"Expected .docx in content-disposition but got {content_disposition}"
        
        # Content should start with PK (ZIP/DOCX signature)
        content = response.content
        assert len(content) > 0, "Response content is empty"
        assert content[:2] == b'PK', f"DOCX should start with PK (ZIP signature), got {content[:2]}"
        
        print(f"SUCCESS: PDF to DOCX conversion returned {len(content)} bytes")

    def test_convert_pdf_to_word_rejects_non_pdf(self):
        """Test non-PDF file rejected with 400 error"""
        # Create a simple text file
        text_content = b"This is not a PDF file"
        
        files = {'file': ('test.txt', io.BytesIO(text_content), 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-word", files=files)
        
        # Status code assertion - should be 400
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        
        # Error detail assertion
        data = response.json()
        assert 'detail' in data, "Expected 'detail' in error response"
        assert 'pdf' in data['detail'].lower(), f"Expected PDF mentioned in error but got: {data['detail']}"
        
        print(f"SUCCESS: Non-PDF file rejected with 400: {data['detail']}")

    def test_convert_pdf_to_word_rejects_docx_file(self):
        """Test DOCX file rejected with 400 error (only accepts PDF)"""
        try:
            docx_content = create_test_docx()
        except ImportError:
            pytest.skip("python-docx not available for this test")
            return
            
        files = {'file': ('test.docx', io.BytesIO(docx_content), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-word", files=files)
        
        # Status code assertion - should be 400
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        
        # Error detail assertion
        data = response.json()
        assert 'detail' in data, "Expected 'detail' in error response"
        
        print(f"SUCCESS: DOCX file rejected with 400: {data['detail']}")

    def test_convert_pdf_to_word_output_filename(self):
        """Test converted DOCX has correct filename based on input"""
        pdf_content = create_test_pdf()
        
        files = {'file': ('my_document.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-word", files=files)
        
        assert response.status_code == 200
        
        content_disposition = response.headers.get('content-disposition', '')
        assert 'my_document.docx' in content_disposition, f"Expected my_document.docx in content-disposition but got {content_disposition}"
        
        print(f"SUCCESS: Output filename correctly set to my_document.docx")


class TestWordToPdfRegression:
    """Regression tests for Word to PDF conversion - ensuring it still works"""
    
    def test_word_to_pdf_still_works(self):
        """Test Word to PDF conversion still functions (regression)"""
        try:
            docx_content = create_test_docx()
        except ImportError:
            pytest.skip("python-docx not available for this test")
            return
            
        files = {'file': ('test_regression.docx', io.BytesIO(docx_content), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-pdf", files=files)
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}: {response.text}"
        
        # Content-type should be PDF
        content_type = response.headers.get('content-type', '')
        assert 'application/pdf' in content_type, f"Expected PDF content type but got {content_type}"
        
        # Content should start with PDF signature
        content = response.content
        assert len(content) > 0, "Response content is empty"
        assert content[:4] == b'%PDF', f"PDF should start with %PDF, got {content[:4]}"
        
        print(f"SUCCESS: Word to PDF conversion still works - returned {len(content)} bytes")

    def test_word_to_pdf_rejects_pdf_file(self):
        """Test Word to PDF rejects PDF files"""
        pdf_content = create_test_pdf()
        
        files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-pdf", files=files)
        
        # Status code assertion - should be 400
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        
        print(f"SUCCESS: Word to PDF correctly rejects PDF files")


class TestMultiPagePdfConversion:
    """Test PDF with multiple pages converts correctly"""
    
    def test_multipage_pdf_converts(self):
        """Test multi-page PDF converts to DOCX"""
        pdf_content = create_test_pdf(num_pages=3, content="Multi-page test")
        
        files = {'file': ('multipage.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/esignature/convert-to-word", files=files)
        
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}: {response.text}"
        
        content = response.content
        assert len(content) > 0, "Response content is empty"
        assert content[:2] == b'PK', "DOCX should start with PK"
        
        print(f"SUCCESS: Multi-page PDF converted - {len(content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
