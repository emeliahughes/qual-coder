import React, { useEffect, useState } from 'react';
import { Button } from "./ui/button";
import axios from 'axios';
import { API_BASE_URL } from './api';

export default function FooterNav({
  coderName,
  currentIndex,
  goToVideo,
  projectSlug,
  videoId,
  currentResponse,
  totalVideos,
  setTotalVideos
}) {
  const [coderProgress, setCoderProgress] = useState({ submitted: [], saved: [] });
  const [inputValue, setInputValue] = useState(currentIndex + 1);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Update input value when currentIndex changes
  useEffect(() => {
    setInputValue(currentIndex + 1);
  }, [currentIndex]);

  useEffect(() => {
    // Ensure we have totalVideos from first load
    if (!projectSlug || !coderName || totalVideos > 0) return;

    axios.get(`${API_BASE_URL}/api/video-at-index`, {
      params: { project: projectSlug, coder: coderName, index: currentIndex }
    })
      .then(res => {
        if (res.data?.total) {
          setTotalVideos(res.data.total);
        }
      })
      .catch(err => {
        console.error("Failed to fetch total video count:", err);
      });
  }, [projectSlug, coderName, currentIndex, totalVideos, setTotalVideos]);

  // Fetch coder's progress data
  useEffect(() => {
    if (!projectSlug || !coderName || !totalVideos) return;

    axios.get(`${API_BASE_URL}/api/projects`)
      .then(res => {
        const project = res.data.find(p => p.slug === projectSlug);
        if (project && project.responses && project.responses[coderName]) {
          const responses = project.responses[coderName] || [];
          const submittedVideos = [];
          const excludedVideos = [];
          
          // Parse responses to separate submitted and excluded videos
          responses.forEach(response => {
            if (response.excluded) {
              excludedVideos.push(response.video_index || response.video_id);
            } else {
              submittedVideos.push(response.video_index || response.video_id);
            }
          });
          
          setCoderProgress({
            submitted: submittedVideos,
            excluded: excludedVideos,
            saved: [] // This would be populated with draft responses
          });
        }
      })
      .catch(err => {
        console.error("Failed to fetch coder progress:", err);
      });
  }, [projectSlug, coderName, totalVideos]);

  const handleNavigation = async (newIndex) => {
    if (!coderName.trim()) return;

    const categoriesOnly = Object.fromEntries(
      Object.entries(currentResponse).filter(([key]) => key !== 'notes')
    );

    try {
      await axios.post(`${API_BASE_URL}/api/save-progress`, {
        project: projectSlug,
        coder: coderName,
        video_id: videoId,
        response: {
          ...categoriesOnly,
          notes: currentResponse.notes || ""
        }
      });
      goToVideo(newIndex);
    } catch (err) {
      console.error('Error saving progress before navigation:', err);
    }
  };

  const renderProgressBar = () => {
    if (!totalVideos) return null;

    const progressItems = [];
    
    for (let i = 0; i < totalVideos; i++) {
      let status = 'unstarted';
      if (coderProgress.excluded && coderProgress.excluded.includes(i.toString()) || coderProgress.excluded && coderProgress.excluded.includes(i)) {
        status = 'excluded';
      } else if (coderProgress.submitted.includes(i.toString()) || coderProgress.submitted.includes(i)) {
        status = 'submitted';
      } else if (coderProgress.saved.includes(i.toString()) || coderProgress.saved.includes(i)) {
        status = 'saved';
      }
      
      const isCurrent = i === currentIndex;
      
      progressItems.push(
        <div
          key={i}
          className={`progress-segment ${status} ${isCurrent ? 'current' : ''}`}
          style={{
            width: `${100 / totalVideos}%`,
            height: '20px',
            backgroundColor: status === 'excluded' ? '#dc3545' :
                           status === 'submitted' ? '#28a745' : 
                           status === 'saved' ? '#ffc107' : '#e9ecef',
            border: isCurrent ? '2px solid #007bff' : '1px solid #dee2e6',
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={() => handleNavigation(i)}
          title={`Video ${i + 1}${isCurrent ? ' (current)' : ''} - ${status}`}
        >
          {isCurrent && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '8px solid #007bff',
                zIndex: 1
              }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="d-flex" style={{ flex: 1, height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
        {progressItems}
      </div>
    );
  };

  return (
    <div className="d-flex w-100 align-items-center gap-3">
      <div className="col-auto d-flex justify-content-center align-items-center">
        <Button
          onClick={() => handleNavigation(Math.max(currentIndex - 1, 0))}
          disabled={!coderName.trim() || currentIndex === 0}
        >
          Previous
        </Button>
      </div>

      <div className="col d-flex flex-column justify-content-center align-items-center gap-1">
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="video-jump" className="mb-0">Video</label>
          <input
            id="video-jump"
            type="number"
            min="1"
            max={totalVideos}
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);
              
              // Clear existing timer
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
              
              // Set new timer to navigate after 1 second of no typing
              const newTimer = setTimeout(() => {
                const newIndex = parseInt(value, 10) - 1;
                if (!isNaN(newIndex) && newIndex >= 0 && newIndex < totalVideos) {
                  handleNavigation(newIndex);
                }
              }, 1000);
              
              setDebounceTimer(newTimer);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Clear timer and navigate immediately on Enter
                if (debounceTimer) {
                  clearTimeout(debounceTimer);
                }
                const newIndex = parseInt(inputValue, 10) - 1;
                if (!isNaN(newIndex) && newIndex >= 0 && newIndex < totalVideos) {
                  handleNavigation(newIndex);
                }
              }
            }}
            className="form-control form-control-sm"
            style={{ width: '80px' }}
          />
          <span>/ {totalVideos}</span>
        </div>
        {renderProgressBar()}
      </div>

      <div className="col-auto d-flex justify-content-center align-items-center">
        <Button
          onClick={() => handleNavigation(Math.min(currentIndex + 1, totalVideos - 1))}
          disabled={!coderName.trim() || currentIndex >= totalVideos - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
