"""
PDF Editor API Tests
Tests for PDF upload, document management, annotations, and download endpoints.
"""
import pytest
import requests
import os
import base64
import fitz  # PyMuPDF for creating test PDFs

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Create a minimal valid PDF for testing
def create_test_pdf():
    """Create a minimal valid PDF file for testing."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Test PDF Document for PDF Editor", fontsize=12)
    page.insert_text((72, 100), "Page 1 content", fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestPDFEditorUpload:
    """Tests for PDF upload endpoint."""
    
    def test_upload_pdf_success(self):
        """Test successful PDF upload."""
        pdf_bytes = create_test_pdf()
        files = {'file': ('test_document.pdf', pdf_bytes, 'application/pdf')}
        data = {'user_id': 'test_user_pdf_editor'}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') is True
        assert 'document' in data
        assert 'id' in data['document']
        assert data['document']['filename'] == 'test_document.pdf'
        assert data['document']['page_count'] >= 1
        assert data['document']['size'] > 0
        
        # Store doc_id for cleanup
        pytest.doc_id = data['document']['id']
        print(f"✓ PDF upload successful: {data['document']['id']}")
    
    def test_upload_non_pdf_fails(self):
        """Test that non-PDF files are rejected."""
        files = {'file': ('test.txt', b'This is not a PDF', 'text/plain')}
        data = {'user_id': 'test_user_pdf_editor'}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        
        assert response.status_code == 400
        assert 'PDF' in response.json().get('detail', '')
        print("✓ Non-PDF file correctly rejected")
    
    def test_upload_missing_user_id(self):
        """Test upload without user_id fails."""
        pdf_bytes = create_test_pdf()
        files = {'file': ('test.pdf', pdf_bytes, 'application/pdf')}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files)
        
        # Should fail with 422 (validation error) since user_id is required
        assert response.status_code == 422
        print("✓ Missing user_id correctly rejected")


class TestPDFEditorDocuments:
    """Tests for document listing and retrieval."""
    
    @pytest.fixture(autouse=True)
    def setup_test_document(self):
        """Create a test document before each test."""
        pdf_bytes = create_test_pdf()
        files = {'file': ('test_doc_list.pdf', pdf_bytes, 'application/pdf')}
        data = {'user_id': 'test_user_list_docs'}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        if response.status_code == 200:
            self.doc_id = response.json()['document']['id']
        else:
            self.doc_id = None
        yield
        # Cleanup
        if self.doc_id:
            requests.delete(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}")
    
    def test_list_documents(self):
        """Test listing user's PDF documents."""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents?user_id=test_user_list_docs")
        
        assert response.status_code == 200
        data = response.json()
        assert 'documents' in data
        assert isinstance(data['documents'], list)
        # Should have at least the document we just created
        assert len(data['documents']) >= 1
        
        # Verify document structure
        doc = data['documents'][0]
        assert 'id' in doc
        assert 'filename' in doc
        assert 'page_count' in doc
        assert 'size' in doc
        assert 'created_at' in doc
        print(f"✓ Listed {len(data['documents'])} documents")
    
    def test_get_document_metadata(self):
        """Test getting document metadata and annotations."""
        assert self.doc_id is not None, "Test document not created"
        
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert 'document' in data
        doc = data['document']
        assert doc['id'] == self.doc_id
        assert 'filename' in doc
        assert 'annotations' in doc
        assert isinstance(doc['annotations'], list)
        print(f"✓ Got document metadata: {doc['filename']}")
    
    def test_get_document_not_found(self):
        """Test getting non-existent document returns 404."""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/nonexistent-doc-id")
        
        assert response.status_code == 404
        print("✓ Non-existent document correctly returns 404")
    
    def test_stream_pdf(self):
        """Test streaming the original PDF."""
        assert self.doc_id is not None, "Test document not created"
        
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/pdf")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 0
        # Verify it's a valid PDF (starts with %PDF)
        assert response.content[:4] == b'%PDF'
        print(f"✓ Streamed PDF: {len(response.content)} bytes")


class TestPDFEditorAnnotations:
    """Tests for annotation save/update."""
    
    @pytest.fixture(autouse=True)
    def setup_test_document(self):
        """Create a test document before each test."""
        pdf_bytes = create_test_pdf()
        files = {'file': ('test_annotations.pdf', pdf_bytes, 'application/pdf')}
        data = {'user_id': 'test_user_annotations'}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        if response.status_code == 200:
            self.doc_id = response.json()['document']['id']
        else:
            self.doc_id = None
        yield
        # Cleanup
        if self.doc_id:
            requests.delete(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}")
    
    def test_save_annotations(self):
        """Test saving annotations to a document."""
        assert self.doc_id is not None, "Test document not created"
        
        annotations = [
            {"type": "text", "x": 0.1, "y": 0.2, "page": 1, "text": "Test annotation", "color": "#1e1b4b", "fontSize": 14, "id": 1},
            {"type": "highlight", "x": 0.3, "y": 0.4, "page": 1, "width": 0.2, "height": 0.025, "color": "#ffff00", "id": 2},
            {"type": "note", "x": 0.5, "y": 0.6, "page": 1, "text": "This is a note", "color": "#059669", "id": 3},
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/annotations",
            json={"annotations": annotations}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') is True
        assert data.get('annotation_count') == 3
        print(f"✓ Saved {data['annotation_count']} annotations")
        
        # Verify annotations were saved by fetching document
        get_response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}")
        assert get_response.status_code == 200
        doc = get_response.json()['document']
        assert len(doc['annotations']) == 3
        print("✓ Annotations persisted correctly")
    
    def test_save_annotations_not_found(self):
        """Test saving annotations to non-existent document."""
        response = requests.put(
            f"{BASE_URL}/api/pdf-editor/documents/nonexistent-doc/annotations",
            json={"annotations": []}
        )
        
        assert response.status_code == 404
        print("✓ Annotations save to non-existent doc returns 404")


class TestPDFEditorSaveEdited:
    """Tests for saving edited PDF with baked annotations."""
    
    @pytest.fixture(autouse=True)
    def setup_test_document(self):
        """Create a test document before each test."""
        pdf_bytes = create_test_pdf()
        files = {'file': ('test_edited.pdf', pdf_bytes, 'application/pdf')}
        data = {'user_id': 'test_user_edited'}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        if response.status_code == 200:
            self.doc_id = response.json()['document']['id']
            self.pdf_bytes = pdf_bytes
        else:
            self.doc_id = None
            self.pdf_bytes = None
        yield
        # Cleanup
        if self.doc_id:
            requests.delete(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}")
    
    def test_save_edited_pdf(self):
        """Test saving edited PDF with baked annotations."""
        assert self.doc_id is not None, "Test document not created"
        
        # Create a "edited" PDF (just use the same bytes for testing)
        edited_b64 = base64.b64encode(self.pdf_bytes).decode('utf-8')
        
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/save-edited",
            json={"pdf_base64": edited_b64}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') is True
        assert 'edited_document' in data
        assert data['edited_document']['id'] == self.doc_id
        assert '_edited.pdf' in data['edited_document']['filename']
        print(f"✓ Saved edited PDF: {data['edited_document']['filename']}")
    
    def test_save_edited_missing_data(self):
        """Test saving edited PDF without base64 data fails."""
        assert self.doc_id is not None, "Test document not created"
        
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/save-edited",
            json={}
        )
        
        assert response.status_code == 400
        assert 'pdf_base64' in response.json().get('detail', '')
        print("✓ Missing pdf_base64 correctly rejected")


class TestPDFEditorDownload:
    """Tests for downloading edited/original PDF."""
    
    @pytest.fixture(autouse=True)
    def setup_test_document(self):
        """Create a test document before each test."""
        pdf_bytes = create_test_pdf()
        files = {'file': ('test_download.pdf', pdf_bytes, 'application/pdf')}
        data = {'user_id': 'test_user_download'}
        
        response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        if response.status_code == 200:
            self.doc_id = response.json()['document']['id']
            self.pdf_bytes = pdf_bytes
        else:
            self.doc_id = None
            self.pdf_bytes = None
        yield
        # Cleanup
        if self.doc_id:
            requests.delete(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}")
    
    def test_download_original_pdf(self):
        """Test downloading original PDF when no edited version exists."""
        assert self.doc_id is not None, "Test document not created"
        
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/download")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert 'attachment' in response.headers.get('content-disposition', '')
        assert len(response.content) > 0
        print(f"✓ Downloaded original PDF: {len(response.content)} bytes")
    
    def test_download_edited_pdf(self):
        """Test downloading edited PDF after saving."""
        assert self.doc_id is not None, "Test document not created"
        
        # First save an edited version
        edited_b64 = base64.b64encode(self.pdf_bytes).decode('utf-8')
        save_response = requests.post(
            f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/save-edited",
            json={"pdf_base64": edited_b64}
        )
        assert save_response.status_code == 200
        
        # Now download - should get the edited version
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{self.doc_id}/download")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert '_edited.pdf' in response.headers.get('content-disposition', '')
        print("✓ Downloaded edited PDF with correct filename")
    
    def test_download_not_found(self):
        """Test downloading non-existent document returns 404."""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/nonexistent-doc/download")
        
        assert response.status_code == 404
        print("✓ Download non-existent doc returns 404")


class TestPDFEditorDelete:
    """Tests for document deletion."""
    
    def test_delete_document(self):
        """Test deleting a PDF document."""
        # First create a document
        pdf_bytes = create_test_pdf()
        files = {'file': ('test_delete.pdf', pdf_bytes, 'application/pdf')}
        data = {'user_id': 'test_user_delete'}
        
        upload_response = requests.post(f"{BASE_URL}/api/pdf-editor/upload", files=files, data=data)
        assert upload_response.status_code == 200
        doc_id = upload_response.json()['document']['id']
        
        # Delete the document
        response = requests.delete(f"{BASE_URL}/api/pdf-editor/documents/{doc_id}")
        
        assert response.status_code == 200
        assert response.json().get('success') is True
        print(f"✓ Deleted document: {doc_id}")
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{doc_id}")
        assert get_response.status_code == 404
        print("✓ Deleted document no longer accessible")
    
    def test_delete_not_found(self):
        """Test deleting non-existent document returns 404."""
        response = requests.delete(f"{BASE_URL}/api/pdf-editor/documents/nonexistent-doc-id")
        
        assert response.status_code == 404
        print("✓ Delete non-existent doc returns 404")


class TestModulePermissions:
    """Tests for pdf_editor module in permissions system."""
    
    def test_pdf_editor_in_modules_list(self):
        """Test that pdf_editor is in the modules list."""
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/modules")
        
        assert response.status_code == 200
        data = response.json()
        modules = [m['key'] for m in data.get('modules', [])]
        assert 'pdf_editor' in modules, "pdf_editor not found in modules list"
        
        # Check label
        pdf_editor_module = next((m for m in data['modules'] if m['key'] == 'pdf_editor'), None)
        assert pdf_editor_module is not None
        assert pdf_editor_module['label'] == 'PDF Editor'
        print("✓ pdf_editor module found with correct label")
    
    def test_pdf_editor_in_role_templates(self):
        """Test that pdf_editor is enabled in role templates."""
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates")
        
        assert response.status_code == 200
        data = response.json()
        templates = data.get('templates', [])
        
        # Check admin template has pdf_editor enabled
        admin_template = next((t for t in templates if t['role'] == 'admin'), None)
        if admin_template:
            assert admin_template['permissions'].get('pdf_editor') is True, "pdf_editor not enabled for admin"
            print("✓ pdf_editor enabled for admin role")
        
        # Check manager template has pdf_editor enabled
        manager_template = next((t for t in templates if t['role'] == 'manager'), None)
        if manager_template:
            assert manager_template['permissions'].get('pdf_editor') is True, "pdf_editor not enabled for manager"
            print("✓ pdf_editor enabled for manager role")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
