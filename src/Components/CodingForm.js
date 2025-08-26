// CodingForm.jsx
import React, { useState } from 'react';
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import axios from 'axios';
import { API_BASE_URL } from './api';
import { Button } from 'react-bootstrap';

export default function CodingForm({
  categories,
  orderedCategories,
  currentResponse,
  coderName,
  setShowWarning,
  addResponseOption,
  addCategory,
  updateResponse,
  handleNoteChange,
  projectSlug,
  videoId,
  project,
  onSaveProject
}) {
  const isExcluded = currentResponse.excluded || false;

const handleSubmit = async () => {
  if (!coderName.trim()) return setShowWarning(true);

  try {
    if (isExcluded) {
      // For excluded videos, only send the excluded status
      await axios.post(`${API_BASE_URL}/api/submit`, {
        project: projectSlug,
        coder: coderName,
        video_id: videoId,
        excluded: true,
        notes: currentResponse.notes || ""
      });
    } else {
      // Extract category responses (excluding notes and excluded status)
      const categoriesOnly = Object.fromEntries(
        Object.entries(currentResponse).filter(([key]) => key !== 'notes' && key !== 'excluded')
      );

      await axios.post(`${API_BASE_URL}/api/submit`, {
        project: projectSlug,
        coder: coderName,
        video_id: videoId,
        categories: categoriesOnly,
        notes: currentResponse.notes || ""
      });
    }
    alert('Response submitted successfully.');
  } catch (err) {
    console.error('Submit error:', err);
    alert('Submission failed.');
  }
};

  return (
    <div className="px-3 py-2 d-flex flex-column" style={{ width: '100%', height: '100%', fontSize: '0.85rem', lineHeight: '1.1rem' }}>


      {/* Category blocks - disabled when excluded */}
      <div style={{ opacity: isExcluded ? 0.5 : 1, pointerEvents: isExcluded ? 'none' : 'auto' }}>
        {(orderedCategories && orderedCategories.length > 0
          ? orderedCategories
          : Object.keys(categories).map((name) => ({ category: name, tags: categories[name] || [] }))
        ).map((catItem, catIndex) => {
        const catName = catItem.category;
        const options = (catItem.tags || []).map((t) => typeof t === 'string' ? t : t?.tag).filter(Boolean);
        return (
          <div key={`category-${catIndex}`} className="mb-2">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: '0.9em' }}>{catName}</label>

            <div className="d-flex flex-wrap gap-1 mb-1">
              {options.length > 0 && options.map((tag, tagIndex) => {
                const isSelected = (currentResponse[catName] || []).some((t) => t === tag);
                const inputId = `cat-${catIndex}-tag-${tagIndex}`;

                return (
                  <div key={`tag-${catIndex}-${tagIndex}`}>
                    <input
                      type="checkbox"
                      className="btn-check"
                      id={inputId}
                      autoComplete="off"
                      checked={isSelected}
                      onChange={() => {
                        if (!coderName.trim()) return setShowWarning(true);
                        const current = currentResponse[catName] || [];
                        const updated = isSelected
                          ? current.filter((t) => t !== tag)
                          : [...current, tag];
                        updateResponse(catName, updated);
                      }}
                    />

                    <label
                      className="btn btn-outline-primary btn-sm"
                      htmlFor={inputId}
                      style={{ whiteSpace: 'nowrap', minWidth: 'fit-content', paddingTop: '0.15rem', paddingBottom: '0.15rem', paddingLeft: '0.4rem', paddingRight: '0.4rem', fontSize: '0.95em' }}
                    >
                      {tag}
                    </label>
                  </div>
                );
              })}

              {/* Add new tag inline */}
              <label className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center" style={{ minWidth: 'fit-content', paddingTop: '0.15rem', paddingBottom: '0.15rem', paddingLeft: '0.4rem', paddingRight: '0.4rem', fontSize: '0.95em' }}>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 bg-transparent p-0 m-0 shadow-none text-center"
                  placeholder="+ Add new tag"
                  style={{ width: '5.5rem', fontSize: '0.95em', minHeight: 'auto', height: 'auto', lineHeight: '1.1rem' }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const newTag = e.target.value.trim();
                      if (!newTag) return;
                      try {
                        await axios.post(`${API_BASE_URL}/api/codebook`, {
                          project: projectSlug,
                          category: catName,
                          tag: newTag
                        });
                        addResponseOption(catName, newTag);
                        const current = currentResponse[catName] || [];
                        if (!current.includes(newTag)) {
                          updateResponse(catName, [...current, newTag]);
                        }
                        e.target.value = '';
                      } catch (err) {
                        console.error('Failed to add tag:', err);
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>
        );
      })}
      </div>

      {/* Add new category */}
      <div className="mb-2">
        <Button
          variant="primary"
          size="sm"
          className="fw-semibold"
          style={{ fontSize: '0.9em', paddingTop: '0.2rem', paddingBottom: '0.2rem', paddingLeft: '0.55rem', paddingRight: '0.55rem' }}
          onClick={async () => {
            const newCat = (window.prompt('New category name?') || '').trim();
            if (!newCat) return;
            if (categories[newCat]) return;
            try {
              await axios.post(`${API_BASE_URL}/api/codebook`, {
                project: projectSlug,
                category: newCat
              });
              addCategory(newCat);
            } catch (err) {
              console.error('Failed to add category:', err);
            }
          }}
        >
          + Add category
        </Button>
      </div>

      {/* Notes field */}
      <div className="mt-auto">
        <label className="form-label fw-semibold" style={{ fontSize: '0.9em' }}>Notes</label>
        <Textarea
          value={currentResponse.notes || ''}
          onChange={handleNoteChange}
          className="form-control"
          rows={3}
          style={{ fontSize: '0.9em' }}
        />

        <div className="d-flex justify-content-between align-items-center mt-1" style={{ paddingBottom: '0.25rem' }}>
          <div className="form-check d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              id="exclude-video"
              checked={isExcluded}
              onChange={(e) => {
                if (!coderName.trim()) return setShowWarning(true);
                const updated = {
                  ...currentResponse,
                  excluded: e.target.checked
                };
                // Clear all category selections when excluding
                if (e.target.checked) {
                  Object.keys(categories).forEach(cat => {
                    updated[cat] = [];
                  });
                }
                // Update the response
                Object.keys(updated).forEach(key => {
                  if (key === 'excluded') {
                    // Handle excluded status specially
                    if (e.target.checked) {
                      updateResponse('excluded', true);
                    } else {
                      updateResponse('excluded', false);
                    }
                  } else if (key !== 'notes') {
                    updateResponse(key, updated[key]);
                  }
                });
              }}
            />
            <label className="form-check-label fw-semibold p-2 d-flex align-items-end" htmlFor="exclude-video" style={{ fontSize: '0.9em', color: isExcluded ? '#dc3545' : 'inherit' }}>
              Exclude this video from dataset
            </label>
          </div>
          <Button variant="success" size="sm" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>

    </div>
  );
}
