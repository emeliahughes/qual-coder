// TikTokCodingTool.js - A tool for qualitative video coding in a TikTok dataset

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { MultiSelect } from "./ui/multiselect";

export default function TikTokCodingTool() {
  // Track coder identity and validation
  const [previousCoderName, setPreviousCoderName] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  // Navigation and video dataset state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState([]);

  // Load and parse CSV dataset on mount
  useEffect(() => {
    fetch('/data/tiktok_data.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          error: (err) => {
            console.error("CSV parse error:", err);
          },
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cleaned = results.data
              .filter(v => v.id && v.webVideoUrl)
              .map((v) => ({
                id: v.id,
                url: v.webVideoUrl,
                metadata: {
                  author: v.author_name,
                  description: v.text,
                  view_count: Number(v.playCount),
                  like_count: Number(v.diggCount),
                  share_count: Number(v.shareCount),
                  comment_count: Number(v.commentCount),
                  save_count: Number(v.collectCount),
                  create_time: new Date(Number(v.createTime) * 1000).toLocaleString(),
                }
              }));
            setVideos(cleaned);
          }
        });
      });
  }, []);

  // Dynamically load TikTok embed script on video change
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [currentIndex]);

  // Initialize default coding schema
  const [categories, setCategories] = useState({
    'Type of Video': ['Funny', 'Happy', 'Sad'],
  });

  // Track coder input and prior saved responses
  const [coderName, setCoderName] = useState('');
  const [responses, setResponses] = useState(() => {
    const stored = localStorage.getItem('responses');
    return stored ? JSON.parse(stored) : {};
  });

  // Guard render until data is loaded
  if (!videos.length) return <div className='p-4'>Loading videos...</div>;

  // Access current video and response state
  const currentVideo = videos[currentIndex];
  const currentResponse = responses[currentVideo.id]?.[coderName] || {};

  // Save updated responses to localStorage
  const saveResponses = (updatedResponses) => {
    setResponses(updatedResponses);
    localStorage.setItem('responses', JSON.stringify(updatedResponses));
  };

  // Add new code categories dynamically
  const addCategory = (name) => {
    if (!categories[name]) {
      setCategories({ ...categories, [name]: [] });
    }
  };

  // Add new options to a code category
  const addResponseOption = (category, option) => {
    if (categories[category] && !categories[category].includes(option)) {
      setCategories({
        ...categories,
        [category]: [...categories[category], option],
      });
    }
  };

  // Update current coder's response for the video
  const updateResponse = (category, values) => {
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

  // Track freeform notes
  const handleNoteChange = (e) => {
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

  // Navigation with coder name required
  const goToVideo = (newIndex) => {
    if (!coderName.trim()) {
      alert('Please enter or select a coder name before proceeding.');
      return;
    }
    setCurrentIndex(newIndex);
  };

  // Track prior coders to allow re-selection
  const previousCoders = Array.from(new Set(Object.values(responses).flatMap(v => Object.keys(v))));

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main content container */}
      <div className="container flex-grow-1 d-flex flex-column" style={{ flex: 1, overflow: 'hidden' }}>
        <div className="row flex-grow-1 overflow-hidden">
          {/* Video + Metadata Column */}
          <div className="col-md-6 mb-4 px-4 py-3">
            <div className="row">
              <div className="col-md-6 px-4 py-3">
                <div key={currentVideo.id}>
                  <blockquote
                    className="tiktok-embed w-100"
                    cite={`https://www.tiktok.com/@${currentVideo.metadata.author}/video/${currentVideo.id.toString()}`}
                    data-video-id={currentVideo.id.toString()}
                    style={{ maxWidth: '100%', margin: 0 }}
                  >
                    <section>Loading…</section>
                  </blockquote>
                </div>
              </div>
              <div className="col-md-6 px-4 py-3">
                <div className="bg-light p-3 rounded border">
                  <p><strong>Author:</strong> {currentVideo.metadata.author}</p>
                  <p><strong>Description:</strong> {currentVideo.metadata.description}</p>
                  <p><strong>Created:</strong> {currentVideo.metadata.create_time}</p>
                  <p><strong>Views:</strong> {currentVideo.metadata.view_count}</p>
                  <p><strong>Likes:</strong> {currentVideo.metadata.like_count}</p>
                  <p><strong>Shares:</strong> {currentVideo.metadata.share_count}</p>
                  <p><strong>Comments:</strong> {currentVideo.metadata.comment_count}</p>
                  <p><strong>Saves:</strong> {currentVideo.metadata.save_count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coding Form Column */}
          <div className="col-md-6 px-4 py-3">
            {/* Coding form section continues here... */}
          </div>
        </div>
      </div>

      {/* Footer Navigation & Coder Identity */}
      <div className="border-top p-3 d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ flexShrink: 0 }}>
        {/* Footer section with navigation and coder input */}
      </div>
    </div>
  );
}