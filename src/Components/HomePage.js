import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, ListGroup, ProgressBar } from 'react-bootstrap';
import { PencilSquare } from 'react-bootstrap-icons';
import axios from 'axios';
import ProjectEditorModal from './ProjectEditorModal';
import { API_BASE_URL } from './api';

export default function HomePage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(null);
  const [selectedCoder, setSelectedCoder] = useState('');
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);

  const selectedProject = selectedProjectIndex !== null ? projects[selectedProjectIndex] : null;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/projects`)
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to load projects:', err));
  }, []);

  const handleSaveProject = (updatedProject) => {
    const method = editingProjectIndex !== null ? 'put' : 'post';
    const url = editingProjectIndex !== null
      ? `${API_BASE_URL}/api/project/${projects[editingProjectIndex].slug}`
      : `${API_BASE_URL}/api/projects`;

    axios[method](url, updatedProject)
      .then(() => axios.get(`${API_BASE_URL}/api/projects`))
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to save project:', err));

    setShowProjectEditor(false);
    setEditingProjectIndex(null);
  };

  const handleDeleteProject = (projectToDelete) => {
    axios.delete(`${API_BASE_URL}/api/project/${projectToDelete.slug}`)
      .then(() => {
        const updated = projects.filter((p) => p.slug !== projectToDelete.slug);
        setProjects(updated);
        setShowProjectEditor(false);
        setEditingProjectIndex(null);
      })
      .catch(err => console.error('Failed to delete project:', err));
  };

  const handleStartCoding = () => {
    if (!selectedProject || !selectedCoder.trim()) return;
    navigate('/coding', {
      state: {
        project: selectedProject,
        coderName: selectedCoder.trim()
      }
    });
  };

  const calculateProgress = (project, coder) => {
    const totalVideos = project.video_count || 0;
    const coderCompleted = project.responses?.[coder]?.length || 0;
    const totalRequired = totalVideos * (project.coders?.length || 1);
    const totalCompleted = project.coders?.reduce((sum, name) => sum + (project.responses?.[name]?.length || 0), 0) || 0;

    const coderPercent = totalVideos ? Math.round((coderCompleted / totalVideos) * 100) : 0;
    const overallPercent = totalRequired ? Math.round((totalCompleted / totalRequired) * 100) : 0;

    return { coderCompleted, totalVideos, coderPercent, totalCompleted, totalRequired, overallPercent };
  };

  const progress = selectedProject && selectedCoder ? calculateProgress(selectedProject, selectedCoder) : null;

  return (
    <div className="container py-4">
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Projects</span>
              {selectedProject && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setEditingProjectIndex(selectedProjectIndex);
                    setShowProjectEditor(true);
                  }}
                >
                  <PencilSquare size={16} className="me-1" />
                </Button>
              )}
            </Card.Header>
            <ListGroup variant="flush">
              {projects.map((proj, index) => (
                <ListGroup.Item
                  key={index}
                  active={index === selectedProjectIndex}
                  action
                  onClick={() => setSelectedProjectIndex(index)}
                >
                  {proj.name}
                </ListGroup.Item>
              ))}
              <ListGroup.Item action onClick={() => { setEditingProjectIndex(null); setShowProjectEditor(true); }}>
                + Add Project
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          <Row className="mb-3">
            <Col>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Project Stats</span>
                  {selectedProject && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setEditingProjectIndex(selectedProjectIndex);
                        setShowProjectEditor(true);
                      }}
                    >
                      <PencilSquare className="me-1" /> Edit Project
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  {selectedProject ? (
                    <>
                      <div><strong>Coders:</strong> {selectedProject.coders?.join(', ') || 'None'}</div>
                      <div className="mt-2"><strong>Progress:</strong></div>
                      <div className="small text-muted">
                        {selectedCoder || 'Current'} progress — {progress?.coderCompleted || 0} / {progress?.totalVideos || 0}
                      </div>
                      <ProgressBar 
                        now={progress?.coderPercent || 0} 
                        label={`${progress?.coderPercent || 0}%`} 
                        className="mb-2" 
                      />
                      <div className="small text-muted">
                        Overall progress — {progress?.totalCompleted || 0} / {progress?.totalRequired || 0}
                      </div>
                      <ProgressBar 
                        now={progress?.overallPercent || 0} 
                        label={`${progress?.overallPercent || 0}%`} 
                      />
                    </>
                  ) : (
                    <div className="text-muted">Select a project to see stats</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Card>
                <Card.Header>Coder</Card.Header>
                <Card.Body>
                  <input
                    className="form-control"
                    placeholder="Enter your coder name"
                    value={selectedCoder}
                    onChange={(e) => {
                      const newName = e.target.value;
                      if (
                        selectedProject &&
                        selectedProject.coders?.includes(selectedCoder) &&
                        newName.trim() !== selectedCoder.trim()
                      ) {
                        const confirm = window.confirm(
                          `Change coder name from "${selectedCoder}" to "${newName}"? This will update all related data.`
                        );
                        if (confirm) {
                          axios.put(`${API_BASE_URL}/api/coder`, {
                            project: selectedProject.slug,
                            old_name: selectedCoder,
                            new_name: newName
                          })
                            .then(() => {
                              const updated = { ...selectedProject };
                              updated.coders = updated.coders.map(n => n === selectedCoder ? newName : n);
                              const updatedProjects = [...projects];
                              updatedProjects[selectedProjectIndex] = updated;
                              setProjects(updatedProjects);
                              setSelectedCoder(newName);
                            })
                            .catch(err => {
                              console.error('Failed to update coder name:', err);
                              alert('Failed to update coder name.');
                            });
                        }
                      } else {
                        setSelectedCoder(newName);
                      }
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col className="text-end">
              <Button
                variant="success"
                disabled={!selectedProject || !selectedCoder.trim()}
                onClick={handleStartCoding}
              >
                Start Coding
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <ProjectEditorModal
        show={showProjectEditor}
        onClose={() => setShowProjectEditor(false)}
        project={editingProjectIndex !== null ? projects[editingProjectIndex] : null}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
