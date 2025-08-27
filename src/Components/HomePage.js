import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, ListGroup, Form } from 'react-bootstrap';
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
  const [codebook, setCodebook] = useState([]);

  const selectedProject = selectedProjectIndex !== null ? projects[selectedProjectIndex] : null;

  const loadProjects = () => {
    axios.get(`${API_BASE_URL}/api/projects`)
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to load projects:', err));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Refresh projects when the page becomes visible (e.g., when returning from coding page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      axios.get(`${API_BASE_URL}/api/project-info?project=${selectedProject.slug}`)
        .then(res => setCodebook(res.data.codebook || []))
        .catch(err => console.error('Failed to load codebook:', err));
    }
  }, [selectedProject]);

  const handleSaveProject = (updatedProject) => {
    const method = editingProjectIndex !== null ? 'put' : 'post';
    const url = editingProjectIndex !== null
      ? `${API_BASE_URL}/api/project/${projects[editingProjectIndex].slug}`
      : `${API_BASE_URL}/api/projects`;

    axios[method](url, updatedProject)
      .then(res => {
        console.log('Project saved successfully:', res.data);
        if (editingProjectIndex !== null) {
          // Update existing project
          const updatedProjects = [...projects];
          updatedProjects[editingProjectIndex] = res.data;
          setProjects(updatedProjects);
        } else {
          // Add new project to the list
          setProjects(prevProjects => [...prevProjects, res.data]);
        }
      })
      .catch(err => {
        console.error('Failed to save project:', err);
        // Fallback: reload all projects if there's an error
        loadProjects();
      });

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
    const coderResponses = project.responses?.[coder] || [];
    
    // Count different types of responses
    let submitted = 0;
    let saved = 0;
    let excluded = 0;
    
    coderResponses.forEach(response => {
      if (typeof response === 'object' && response.excluded) {
        excluded++;
      } else if (typeof response === 'object' && response.status === 'submitted') {
        submitted++;
      } else {
        saved++; // draft status
      }
    });
    
    const completed = submitted + excluded; // Total completed (submitted + excluded)
    const coderPercent = totalVideos ? Math.round((completed / totalVideos) * 100) : 0;
    
    // Calculate overall progress across all coders
    const totalRequired = totalVideos * (project.coders?.length || 1);
    let totalCompleted = 0;
    let totalSubmitted = 0;
    let totalSaved = 0;
    let totalExcluded = 0;
    
    project.coders?.forEach(name => {
      const responses = project.responses?.[name] || [];
      responses.forEach(response => {
        if (typeof response === 'object' && response.excluded) {
          totalExcluded++;
          totalCompleted++; // Count excluded toward completion
        } else if (typeof response === 'object' && response.status === 'submitted') {
          totalSubmitted++;
          totalCompleted++; // Count submitted toward completion
        } else {
          totalSaved++; // Count saved/draft responses for display
        }
      });
    });
    
    const overallPercent = totalRequired ? Math.round((totalCompleted / totalRequired) * 100) : 0;

    return { 
      submitted, 
      saved, 
      excluded, 
      completed, 
      totalVideos, 
      coderPercent, 
      totalSubmitted, 
      totalSaved,
      totalExcluded, 
      totalCompleted, 
      totalRequired, 
      overallPercent 
    };
  };

  const handleDownload = (type) => {
    if (!selectedProject?.slug) return;
    const url = `${API_BASE_URL}/api/download-${type}?project=${selectedProject.slug}`;
    window.open(url, '_blank');
  };

  const renderProgressBar = (submitted, saved, excluded, total, isOverall = false) => {
    if (total === 0) return <div className="progress" style={{ height: isOverall ? '25px' : '20px' }}><div className="progress-bar bg-secondary" style={{ width: '100%' }}>No videos</div></div>;
    
    const submittedPercent = (submitted / total) * 100;
    const savedPercent = (saved / total) * 100;
    const excludedPercent = (excluded / total) * 100;
    
    return (
      <div className={`progress ${isOverall ? 'border-2 border-primary' : ''}`} style={{ height: isOverall ? '25px' : '20px' }}>
        {submitted > 0 && (
          <div 
            className="progress-bar" 
            style={{ 
              width: `${submittedPercent}%`, 
              backgroundColor: '#198754' // green for submitted
            }}
          />
        )}
        {saved > 0 && (
          <div 
            className="progress-bar" 
            style={{ 
              width: `${savedPercent}%`, 
              backgroundColor: '#ffc107' // yellow for saved
            }}
          />
        )}
        {excluded > 0 && (
          <div 
            className="progress-bar" 
            style={{ 
              width: `${excludedPercent}%`, 
              backgroundColor: '#dc3545' // red for excluded
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="container py-4">
      <Row>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header>Projects</Card.Header>
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

          {selectedProject && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Project Stats</span>
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
              </Card.Header>
              <Card.Body>
                <div><strong>Coders:</strong></div>
                <div>{selectedProject.coders?.join(', ') || 'None'}</div>
                <div className="mt-2">
                    <strong>Project Files:</strong>
                    <ul className="mb-0">
                        {selectedProject.project_files?.length > 0 ? 
                            selectedProject.project_files.map((f, idx) => (
                                <li key={idx}>{typeof f === "string" ? f : f.filename}</li>
                            )) : 
                            <li>None</li>
                        }
                    </ul>
                </div>
                <div className="mt-3 pb-2"><strong>Coder Progress:</strong></div>
                {selectedProject.coders?.map((coder, idx) => {
                  const prog = calculateProgress(selectedProject, coder);
                  return (
                    <div key={idx} className="mb-3">
                      <div className="small text-muted">
                        {coder} — {prog.completed} / {prog.totalVideos}
                      </div>
                      {renderProgressBar(prog.submitted, prog.saved, prog.excluded, prog.totalVideos, false)}
                    </div>
                  );
                })}
                <div className="mt-3">
                  <div className="fw-semibold text-dark">
                    Overall Progress — {
                      calculateProgress(selectedProject, selectedCoder).totalCompleted
                    } / {
                      calculateProgress(selectedProject, selectedCoder).totalRequired
                    }
                  </div>
                </div>
                {renderProgressBar(
                  calculateProgress(selectedProject, selectedCoder).totalSubmitted,
                  calculateProgress(selectedProject, selectedCoder).totalSaved,
                  calculateProgress(selectedProject, selectedCoder).totalExcluded,
                  calculateProgress(selectedProject, selectedCoder).totalRequired,
                  true
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={8}>
          {selectedProject && (
            <Row className="mb-3">
              <Col>
                <Card>
                  <Card.Header>Coder</Card.Header>
                  <Card.Body>
                    <Form.Control
                      placeholder="Add a new coder name or select below"
                      value={selectedCoder}
                      onChange={(e) => setSelectedCoder(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!selectedProject.coders.includes(selectedCoder)) {
                            axios.post(`${API_BASE_URL}/api/coder`, {
                              project: selectedProject.slug,
                              coder: selectedCoder
                            }).then(() => {
                              const updated = { ...selectedProject };
                              updated.coders = [...updated.coders, selectedCoder];
                              const updatedProjects = [...projects];
                              updatedProjects[selectedProjectIndex] = updated;
                              setProjects(updatedProjects);
                            }).catch(err => {
                              console.error('Failed to add coder:', err);
                            });
                          }
                        }
                      }}
                    />
                    <div className="mt-3 d-flex flex-wrap gap-2">
                      {selectedProject.coders.map((coder, idx) => (
                        <Button
                          key={idx}
                          variant={coder === selectedCoder ? "primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => setSelectedCoder(coder)}
                        >
                          {coder}
                        </Button>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Row className="mb-3">
            <Col>
              <Card>
                <Card.Header>Codebook</Card.Header>
                <Card.Body>
                  {codebook.length === 0 ? (
                    <div className="text-muted">No codebook defined for this project.</div>
                  ) : (
                    codebook.map((cat, i) => (
                      <div key={i} className="mb-3">
                        <strong>{cat.category}</strong>: {cat.description}
                        <ul>
                          {cat.tags.map((tagObj, j) => (
                            <li key={j}><em>{tagObj.tag}</em> — {tagObj.description}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col className="d-flex justify-content-between align-items-center">
              <div>
                <Button variant="outline-primary" onClick={() => handleDownload('codebook')} className="me-2">
                  Download Codebook
                </Button>
                <Button variant="outline-success" onClick={() => handleDownload('results')} className="me-2">
                  Download Results
                </Button>
                <Button 
                  variant="outline-info" 
                  onClick={() => navigate('/results', { state: { project: selectedProject } })}
                  disabled={!selectedProject}
                >
                  View Results
                </Button>
              </div>
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
