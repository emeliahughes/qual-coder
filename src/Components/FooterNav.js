import React from 'react';
import { Button } from "./ui/button";
import axios from 'axios';
import { API_BASE_URL } from './api';

export default function FooterNav({
  coderName,
  currentIndex,
  videos,
  goToVideo,
  projectSlug,
  videoId,
  currentResponse
}) {
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

  return (
    <div className="d-flex w-100 align-items-center">
      <div className="col d-flex justify-content-center align-items-center">
        <Button
          onClick={() => handleNavigation(Math.max(currentIndex - 1, 0))}
          disabled={!coderName.trim()}
        >
          Previous
        </Button>
      </div>

      <div className="col d-flex justify-content-center align-items-center gap-2">
        <label htmlFor="video-jump" className="mb-0">Video</label>
        <input
          id="video-jump"
          type="number"
          min="1"
          max={videos.length}
          value={currentIndex + 1}
          onChange={(e) => {
            const newIndex = parseInt(e.target.value, 10) - 1;
            if (!isNaN(newIndex) && newIndex >= 0 && newIndex < videos.length) {
              handleNavigation(newIndex);
            }
          }}
          className="form-control form-control-sm"
          style={{ width: '80px' }}
        />
        <span>/ {videos.length}</span>
      </div>

      <div className="col d-flex justify-content-center align-items-center">
        <Button
          onClick={() => handleNavigation(Math.min(currentIndex + 1, videos.length - 1))}
          disabled={!coderName.trim()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
