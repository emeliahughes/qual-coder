// ProjectEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup, InputGroup, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from './api';

export default function ProjectEditorModal({ show, onClose, project, onSave, onDelete }) {
  const isNew = !project;
  const [projectName, setProjectName] = useState('');
  const [coders, setCoders] = useState([]);
  const [codebook, setCodebook] = useState([]);
  const [fileQueue, setFileQueue] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (project?.slug && show) {
      axios.get(`${API_BASE_URL}/api/project-info?project=${project.slug}`)
        .then(res => {
          const data = res.data;
          setProjectName(data.name || '');
          setCoders(data.coders || []);
          setCodebook(data.codebook || []);
        })
        .catch(err => console.error('Error loading project:', err));
    }
  }, [project, show]);


  const handleRemoveCoder = async (name) => {
    if (window.confirm(`Are you sure you want to remove ${name}?`) && project?.slug) {
      try {
        await axios.delete(`${API_BASE_URL}/api/coder`, {
          data: { project: project.slug, coder: name }
        });
        setCoders(coders.filter(c => c !== name));
        triggerToast('Coder removed.');
      } catch (err) {
        console.error('Error removing coder:', err);
      }
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.name.endsWith('.csv'));
    if (validFiles.length !== files.length) {
      alert('Only CSV files are allowed.');
    }
    setFileQueue([...fileQueue, ...validFiles]);
  };

  const uploadFiles = async (slugToUse) => {
    for (const file of fileQueue) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', slugToUse);
      try {
        await axios.post(`${API_BASE_URL}/api/upload-data`, formData);
        triggerToast(`Uploaded: ${file.name}`);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: projectName,
        coders,
        codebook
      };

      let slugForUploads = project?.slug;

      if (isNew) {
        const res = await axios.post(`${API_BASE_URL}/api/projects`, payload);
        slugForUploads = res?.data?.slug;
      } else {
        await axios.put(`${API_BASE_URL}/api/project/${project.slug}`, payload);
      }

      if (fileQueue.length > 0 && slugForUploads) {
        await uploadFiles(slugForUploads);
      }

      triggerToast('Project saved.');
      onSave({ ...payload, slug: slugForUploads || project?.slug });
      onClose();
    } catch (err) {
      console.error('Failed to save project:', err);
      triggerToast('Error saving project.');
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddCategory = () => {
    setCodebook([...codebook, { category: '', description: '', tags: [] }]);
  };

  const handleRemoveCategory = (index) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const updated = [...codebook];
      updated.splice(index, 1);
      setCodebook(updated);
    }
  };

  const handleAddTag = (index) => {
    const newCodebook = [...codebook];
    newCodebook[index].tags.push({ tag: '', description: '' });
    setCodebook(newCodebook);
  };

  const handleRemoveTag = (catIndex, tagIndex) => {
    if (window.confirm('Delete this tag?')) {
      const updated = [...codebook];
      updated[catIndex].tags.splice(tagIndex, 1);
      setCodebook(updated);
    }
  };

  const handleChangeCodebook = (catIndex, field, value) => {
    const updated = [...codebook];
    updated[catIndex][field] = value;
    setCodebook(updated);
  };

  const handleChangeTag = (catIndex, tagIndex, field, value) => {
    const updated = [...codebook];
    updated[catIndex].tags[tagIndex][field] = value;
    setCodebook(updated);
  };

  const handleDownload = (type) => {
    if (!project?.slug) return;
    const url = `${API_BASE_URL}/api/download-${type}?project=${project.slug}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Modal show={show} onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isNew ? 'Create New Project' : 'Edit Project'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Coders</Form.Label>
              <ListGroup>
                {coders.map((name, idx) => (
                  <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                    {name}
                    <Button variant="danger" size="sm" onClick={() => handleRemoveCoder(name)}>Remove</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Data Files</Form.Label>
              <Form.Control type="file" accept=".csv" multiple onChange={handleFileChange} />
              {fileQueue.length > 0 && <Form.Text>{fileQueue.map(f => f.name).join(', ')}</Form.Text>}
            </Form.Group>

            <Form.Group>
              <Form.Label>Codebook</Form.Label>
              {codebook.map((cat, i) => (
                <div key={i} className="border rounded p-2 mb-2">
                  <Row className="mb-2">
                    <Col>
                      <Form.Control
                        placeholder="Category name"
                        value={cat.category}
                        onChange={(e) => handleChangeCodebook(i, 'category', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        placeholder="Description"
                        value={cat.description}
                        onChange={(e) => handleChangeCodebook(i, 'description', e.target.value)}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button variant="outline-danger" size="sm" onClick={() => handleRemoveCategory(i)}>Delete</Button>
                    </Col>
                  </Row>
                  {cat.tags.map((tag, j) => (
                    <Row key={j} className="mb-2 ps-3">
                      <Col>
                        <Form.Control
                          placeholder="Tag"
                          value={tag.tag}
                          onChange={(e) => handleChangeTag(i, j, 'tag', e.target.value)}
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          placeholder="Tag Description"
                          value={tag.description}
                          onChange={(e) => handleChangeTag(i, j, 'description', e.target.value)}
                        />
                      </Col>
                      <Col xs="auto">
                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveTag(i, j)}>Delete</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button size="sm" onClick={() => handleAddTag(i)}>+ Add Tag</Button>
                </div>
              ))}
              <div className="mt-2">
                <Button onClick={handleAddCategory}>+ Add Category</Button>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          {!isNew && (
            <div className="me-auto">
              <Form.Label>Type 'delete' to confirm deletion:</Form.Label>
              <InputGroup>
                <Form.Control
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                />
                <Button
                  variant="danger"
                  disabled={confirmDelete.toLowerCase() !== 'delete'}
                  onClick={() => onDelete(project)}
                >
                  Delete Project
                </Button>
              </InputGroup>
            </div>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast bg="success" onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
