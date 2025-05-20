import React from 'react';
import { Button } from "./ui/button";

export default function FooterNav({
    coderName,
    currentIndex,
    videos,
    goToVideo,
}) {
return (
    <>
    <div className="d-flex w-100 align-items-center">
        <div className="col d-flex justify-content-center align-items-center">
            <Button
                onClick={() => goToVideo(Math.max(currentIndex - 1, 0))}
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
                    goToVideo(newIndex);
                    }
                }}
                className="form-control form-control-sm"
                style={{ width: '80px' }}
            />
            <span>/ {videos.length}</span>
        </div>

        <div className="col d-flex justify-content-center align-items-center">
            <Button
                onClick={() => goToVideo(Math.min(currentIndex + 1, videos.length - 1))}
                disabled={!coderName.trim()}
                >
                Next
            </Button>
        </div>
    </div>
    </>
);
}
