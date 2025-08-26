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
import CodebookViewer from './CodebookViewer';

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
  const [totalVideos, setTotalVideos] = useState(0);
  const [projectData, setProjectData] = useState(project);
  const [categories, setCategories] = useState({});
  const [codebookList, setCodebookList] = useState([]);
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
        console.log("Video fetched:", res.data); // 👈 Add this
        setVideos((prev) => {
            const updated = [...prev];
            updated[currentIndex] = res.data;
            return updated;
        });
        })
        .catch(err => console.error("Video fetch error:", err));
    }, [currentIndex, project, coderName]);

  // Fetch latest project info (including codebook) so coding page reflects homepage edits
  useEffect(() => {
    if (!project?.slug) return;
    axios.get(`${API_BASE_URL}/api/project-info`, { params: { project: project.slug } })
      .then(res => {
        const info = res.data || {};
        setProjectData(info);
        const raw = info.codebook || [];
        setCodebookList(raw);
        const formatted = {};
        raw.forEach((c) => {
          const catName = c.category || '';
          const incoming = (c.tags || [])
            .map((t) => (typeof t === 'string' ? t : (t && t.tag)))
            .filter((t) => typeof t === 'string' && t.length > 0);
          formatted[catName] = (formatted[catName] || []).concat(incoming);
        });
        setCategories(formatted);
      })
      .catch(err => console.error('Failed to load project info/codebook:', err));
  }, [project?.slug]);

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
        <div className="d-flex justify-content-between align-items-center border-bottom py-2 px-3">
          <Button variant="outline-secondary" onClick={() => navigate('/')}> <ArrowLeft className="me-2" />Back</Button>
          <div className="text-center">
            <h4 className="mb-1 fw-bold">{project?.name || 'Project'}</h4>
            <div className="fw-semibold" style={{ fontSize: '1rem' }}>Coder: {coderName}</div>
          </div>
          <Button variant="outline-primary" onClick={() => setShowProjectEditor(true)}>Show Codebook</Button>
        </div>

        <Split
          className="flex-grow-1 d-flex"
          style={{ minHeight: 0 }}
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
          <div className="d-flex flex-column w-100" style={{ minHeight: 0 }}>
            <div className="row flex-grow-1" style={{ minHeight: 0 }}>
              <div className="col-md-6 d-flex flex-column h-100">
                <div className="p-3" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <TikTokEmbed video={currentVideo} />
                </div>
              </div>
              <div className="col-md-6 d-flex flex-column h-100 p-3" style={{ minHeight: 0 }}>
                <TikTokMetadata metadata={currentVideo.metadata} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="border-start overflow-auto p-2" style={{ minHeight: 0 }}>
            <CodingForm
              key={`${currentVideo.id}-${coderName}`}
              categories={categories}
              orderedCategories={codebookList}
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
            goToVideo={goToVideo}
            projectSlug={project.slug}
            videoId={currentVideo.id}
            currentResponse={currentResponse}
            totalVideos={totalVideos}
            setTotalVideos={setTotalVideos}
            />
        </div>
      </div>

      <CodebookViewer
        show={showProjectEditor}
        onClose={() => setShowProjectEditor(false)}
        project={projectData}
        onSave={handleSaveProject}
      />
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
