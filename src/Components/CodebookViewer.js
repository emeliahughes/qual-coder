import React, { useState } from 'react';
import { Modal, Button, Form, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from './api';

export default function CodebookViewer({ show, onClose, project, onSave }) {
  const [codebook, setCodebook] = useState(project?.codebook || []);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditCategory = (index) => {
    setEditingCategory(index);
    setIsEditing(true);
  };

  const handleEditTag = (categoryIndex, tagIndex) => {
    setEditingCategory(categoryIndex);
    setEditingTag(tagIndex);
    setIsEditing(true);
  };

  const handleEditTagDescription = (categoryIndex, tagIndex) => {
    const currentTag = codebook[categoryIndex].tags[tagIndex];
    const currentDescription = typeof currentTag === 'object' ? currentTag.description || '' : '';
    const newDescription = prompt('Enter tag description:', currentDescription);
    
    if (newDescription !== null) {
      const updatedCodebook = [...codebook];
      if (typeof currentTag === 'string') {
        updatedCodebook[categoryIndex].tags[tagIndex] = { tag: currentTag, description: newDescription };
      } else {
        updatedCodebook[categoryIndex].tags[tagIndex] = { ...currentTag, description: newDescription };
      }
      setCodebook(updatedCodebook);
      setIsEditing(true);
    }
  };

  const handleSaveCategory = (index, newName) => {
    const updatedCodebook = [...codebook];
    updatedCodebook[index].category = newName;
    setCodebook(updatedCodebook);
    setEditingCategory(null);
    setIsEditing(false);
  };

  const handleSaveTag = (categoryIndex, tagIndex, newTag) => {
    const updatedCodebook = [...codebook];
    const currentTag = updatedCodebook[categoryIndex].tags[tagIndex];
    
    if (typeof currentTag === 'string') {
      updatedCodebook[categoryIndex].tags[tagIndex] = newTag;
    } else {
      updatedCodebook[categoryIndex].tags[tagIndex] = { ...currentTag, tag: newTag };
    }
    
    setCodebook(updatedCodebook);
    setEditingTag(null);
    setIsEditing(false);
  };

  const handleAddCategory = () => {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && newCategory.trim()) {
      setCodebook([...codebook, { category: newCategory.trim(), tags: [] }]);
    }
  };

  const handleAddTag = (categoryIndex) => {
    const newTag = prompt('Enter new tag:');
    if (newTag && newTag.trim()) {
      const updatedCodebook = [...codebook];
      if (!updatedCodebook[categoryIndex].tags) {
        updatedCodebook[categoryIndex].tags = [];
      }
      
      // Check if existing tags are objects or strings to maintain consistency
      const existingTags = updatedCodebook[categoryIndex].tags;
      if (existingTags.length > 0 && typeof existingTags[0] === 'object') {
        // If existing tags are objects, add new tag as object
        updatedCodebook[categoryIndex].tags.push({ tag: newTag.trim() });
      } else {
        // If existing tags are strings, add new tag as string
        updatedCodebook[categoryIndex].tags.push(newTag.trim());
      }
      
      setCodebook(updatedCodebook);
    }
  };

  const handleDeleteCategory = (index) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const updatedCodebook = codebook.filter((_, i) => i !== index);
      setCodebook(updatedCodebook);
    }
  };

  const handleDeleteTag = (categoryIndex, tagIndex) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      const updatedCodebook = [...codebook];
      updatedCodebook[categoryIndex].tags.splice(tagIndex, 1);
      setCodebook(updatedCodebook);
    }
  };

  const handleSaveToBackend = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/project/${project.slug}`, {
        name: project.name,
        codebook: codebook
      });
      onSave({ ...project, codebook });
      setIsEditing(false);
      
      // Show notification if results were updated
      if (response.data.updated_results > 0) {
        alert(`Codebook updated successfully! ${response.data.updated_results} existing results were updated to maintain data integrity.`);
      } else {
        alert('Codebook updated successfully!');
      }
    } catch (err) {
      console.error('Failed to save codebook:', err);
      alert('Failed to save codebook changes.');
    }
  };

  const handleCancel = () => {
    setCodebook(project?.codebook || []);
    setEditingCategory(null);
    setEditingTag(null);
    setIsEditing(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleCancel} size="lg">
      <Modal.Header closeButton>
        <div className="d-flex justify-content-between align-items-center w-100">
          <Modal.Title>Codebook Viewer</Modal.Title>
          <div>
            {isEditing ? (
              <>
                <Button 
                  variant="success" 
                  size="sm" 
                  onClick={handleSaveToBackend}
                  className="me-2"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    setCodebook(project?.codebook || []);
                    setEditingCategory(null);
                    setEditingTag(null);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="me-3"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">

          {codebook.length === 0 ? (
            <div className="text-muted text-center py-4">
              No categories defined yet. {isEditing && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={handleAddCategory}
                  className="p-0"
                >
                  Add your first category
                </Button>
              )}
            </div>
          ) : (
            codebook.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      {editingCategory === categoryIndex ? (
                        <Form.Control
                          type="text"
                          value={category.category}
                          onChange={(e) => {
                            const updatedCodebook = [...codebook];
                            updatedCodebook[categoryIndex].category = e.target.value;
                            setCodebook(updatedCodebook);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCategory(categoryIndex, category.category);
                            } else if (e.key === 'Escape') {
                              setEditingCategory(null);
                              setIsEditing(false);
                            }
                          }}
                          onBlur={() => handleSaveCategory(categoryIndex, category.category)}
                          autoFocus
                          size="sm"
                          style={{ width: '200px' }}
                        />
                      ) : (
                        <span className="fw-bold fs-5">{category.category}</span>
                      )}
                    </div>
                    {category.description && (
                      <div style={{ fontSize: '0.9em', lineHeight: '1.3', color: '#000000' }}>
                        {category.description}
                      </div>
                    )}
                  </div>
                  <div>
                    {isEditing && editingCategory !== categoryIndex && (
                      <>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleEditCategory(categoryIndex)}
                          className="me-1"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteCategory(categoryIndex)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    {category.tags && category.tags.map((tagObj, tagIndex) => {
                      const tagValue = typeof tagObj === 'string' ? tagObj : tagObj.tag || '';
                      const tagDescription = typeof tagObj === 'object' ? tagObj.description : '';
                      
                      return (
                        <div key={tagIndex} className="mb-2 p-2 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                {editingCategory === categoryIndex && editingTag === tagIndex ? (
                                  <Form.Control
                                    type="text"
                                    value={tagValue}
                                    onChange={(e) => {
                                      const updatedCodebook = [...codebook];
                                      const newTagValue = e.target.value;
                                      if (typeof tagObj === 'string') {
                                        updatedCodebook[categoryIndex].tags[tagIndex] = newTagValue;
                                      } else {
                                        updatedCodebook[categoryIndex].tags[tagIndex] = { ...tagObj, tag: newTagValue };
                                      }
                                      setCodebook(updatedCodebook);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveTag(categoryIndex, tagIndex, e.target.value);
                                      } else if (e.key === 'Escape') {
                                        setEditingTag(null);
                                        setIsEditing(false);
                                      }
                                    }}
                                    onBlur={() => handleSaveTag(categoryIndex, tagIndex, tagValue)}
                                    autoFocus
                                    size="sm"
                                    style={{ width: '200px' }}
                                  />
                                ) : (
                                  <span className="fw-semibold">{tagValue}</span>
                                )}
                              </div>
                              {tagDescription && (
                                <div style={{ fontSize: '0.9em', lineHeight: '1.3', color: '#000000' }}>
                                  {tagDescription}
                                </div>
                              )}
                            </div>
                            {isEditing && (editingCategory !== categoryIndex || editingTag !== tagIndex) ? (
                              <div className="ms-2">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleEditTag(categoryIndex, tagIndex)}
                                  className="me-1"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => handleEditTagDescription(categoryIndex, tagIndex)}
                                  className="me-1"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                  title="Edit description"
                                >
                                  Desc
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteTag(categoryIndex, tagIndex)}
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                >
                                  ×
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {isEditing && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleAddTag(categoryIndex)}
                    >
                      + Add Tag
                    </Button>
                  )}
                </Card.Body>
              </Card>
            ))
          )}
          {isEditing && codebook.length > 0 && (
            <div className="text-center mt-3">
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleAddCategory}
              >
                + Add Category
              </Button>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
