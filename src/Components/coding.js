import { useState, useEffect } from 'react';
import { useLocation, useNavigate, BrowserRouter as Router } from 'react-router-dom';
import Papa from 'papaparse';
import CodingForm from './CodingForm';
import FooterNav from './FooterNav';
import TikTokEmbed from './TikTokEmbed';
import TikTokMetadata from './MetaData';
import { Modal, Button } from 'react-bootstrap';
import Split from 'react-split';
import { ArrowLeft } from 'react-bootstrap-icons';
import ReactDOM from 'react-dom';
import { API_BASE_URL } from './api';
import axios from 'axios';
import ProjectEditorModal from './ProjectEditorModal';

export default TikTokCodingTool;

function TikTokCodingTool() {
  const location = useLocation();
  const navigate = useNavigate();
  const project = location.state?.project;
  const initialCoder = location.state?.coderName || '';

  const [previousCoderName, setPreviousCoderName] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState([]);
  const [projectData, setProjectData] = useState(project);
  const [categories, setCategories] = useState(() => {
    const raw = project?.codebook || [];
    const formatted = {};
    raw.forEach((c) => {
      formatted[c.category] = c.tags.map((t) => t.tag);
    });
    return formatted;
  });
  const [coderName, setCoderName] = useState(initialCoder);
  const [responses, setResponses] = useState(() => {
    const stored = localStorage.getItem('responses');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/video-at-index`, {
      params: {
        project: project.slug,
        coder: coderName,
        index: currentIndex
      }
    })
      .then(res => {
        setVideos((prev) => {
          const updated = [...prev];
          updated[currentIndex] = res.data;
          return updated;
        });
      })
      .catch(err => console.error("Video fetch error:", err));
  }, [currentIndex, project, coderName]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [currentIndex]);

  if (!videos[currentIndex]) return <div className='p-4'>Loading video...</div>;

  const currentVideo = videos[currentIndex];
  const currentResponse = responses[currentVideo.id]?.[coderName] || {};

  const saveResponses = (updatedResponses) => {
    setResponses(updatedResponses);
    axios.post(`${API_BASE_URL}/api/save-progress`, {
      project: project.slug,
      coder: coderName,
      video_id: currentVideo.id,
      response: updatedResponses[currentVideo.id]?.[coderName]
    }).catch(console.error);
  };

  const addCategory = (name) => {
    if (!categories[name]) {
      setCategories({ ...categories, [name]: [] });
    }
  };

  const addResponseOption = (category, option) => {
    if (categories[category] && !categories[category].includes(option)) {
      setCategories({
        ...categories,
        [category]: [...categories[category], option],
      });
    }
  };

  const updateResponse = (category, values) => {
    if (!coderName.trim()) {
      setShowWarningModal(true);
      return;
    }
    const updated = {
      ...responses,
      [currentVideo.id]: {
        ...(responses[currentVideo.id] || {}),
        [coderName]: {
          ...(responses[currentVideo.id]?.[coderName] || {}),
          [category]: values,
        },
      },
    };
    saveResponses(updated);
  };

  const handleNoteChange = (e) => {
    if (!coderName.trim()) {
      setShowWarningModal(true);
      return;
    }
    const updated = {
      ...responses,
      [currentVideo.id]: {
        ...(responses[currentVideo.id] || {}),
        [coderName]: {
          ...(responses[currentVideo.id]?.[coderName] || {}),
          notes: e.target.value,
        },
      },
    };
    saveResponses(updated);
  };

  const goToVideo = (newIndex) => {
    if (!coderName.trim()) {
      setShowWarningModal(true);
      return;
    }
    const updatedResponses = {
      ...responses,
      [currentVideo.id]: {
        ...(responses[currentVideo.id] || {}),
        [coderName]: currentResponse
      }
    };
    saveResponses(updatedResponses);
    setCurrentIndex(newIndex);
  };

  const handleSaveProject = (updatedProject) => {
    setProjectData(updatedProject);
    const updated = {};
    updatedProject.codebook.forEach((c) => {
      updated[c.category] = c.tags.map((t) => t.tag);
    });
    setCategories(updated);
  };

  return (
    <div className="d-flex flex-column vh-100">
      <div className="container-fluid flex-grow-1 d-flex flex-column h-100">
        {/* Header */}
        <div className="row justify-content-between align-items-center border-bottom p-3">
          <div className="col-auto">
            <Button variant="outline-secondary" onClick={() => navigate('/')}> <ArrowLeft className="me-2" />Back</Button>
          </div>
          <div className="col text-center">
            <h5 className="mb-0">{project?.name || 'Project'}</h5>
            <small className="text-muted">Coder: {coderName}</small>
          </div>
          <div className="col" />
        </div>

        <Split
          className="flex-grow-1 d-flex"
          style={{ height: '100%' }}
          sizes={[66, 34]}
          minSize={200}
          gutterSize={12}
          direction="horizontal"
          gutter={() => {
            const gutter = document.createElement('div');
            gutter.className = 'custom-gutter d-flex align-items-center me-2';

            const icon = document.createElement('div');
            icon.className = 'gutter-icon h2 me-2 mb-0';
            icon.textContent = '⋮';
            gutter.appendChild(icon);

            return gutter;
          }}
        >
          {/* Left column */}
          <div className="d-flex flex-column h-100 w-100">
            <div className="row flex-grow-1 h-100">
              <div className="col-md-6 d-flex flex-column h-100">
                <div className="p-3" style={{ flex: 1, minHeight: 0, overflow: 'auto', maxHeight: '100%' }}>
                  <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                    <TikTokEmbed video={currentVideo} />
                  </div>
                </div>
              </div>
              <div className="col-md-6 overflow-auto p-3 h-100">
                <TikTokMetadata metadata={currentVideo.metadata} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="border-start overflow-auto p-3 h-100">
            <CodingForm
              key={`${currentVideo.id}-${coderName}`}
              categories={categories}
              currentResponse={currentResponse}
              coderName={coderName}
              setShowWarning={setShowWarningModal}
              addResponseOption={addResponseOption}
              addCategory={addCategory}
              updateResponse={updateResponse}
              handleNoteChange={handleNoteChange}
              projectSlug={project.slug}
              videoId={currentVideo.id}
              project={projectData}
              onSaveProject={handleSaveProject}
            />
          </div>
        </Split>

        <div className="row justify-content-between align-items-center border-top p-3">
          <FooterNav
            coderName={coderName}
            currentIndex={currentIndex}
            videos={videos}
            goToVideo={goToVideo}
            projectSlug={project.slug}
            videoId={currentVideo.id}
            currentResponse={currentResponse}
            />
        </div>
      </div>

      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Coder Name Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Please enter your coder name before tagging or making notes.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowWarningModal(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
