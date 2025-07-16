// CodingForm.jsx
import React, { useState } from 'react';
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import axios from 'axios';
import { API_BASE_URL } from './api';
import { Button } from 'react-bootstrap';
import ProjectEditorModal from './ProjectEditorModal';

export default function CodingForm({
  categories,
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
  const [showProjectEditor, setShowProjectEditor] = useState(false);

const handleSubmit = async () => {
  if (!coderName.trim()) return setShowWarning(true);

  // Extract category responses (excluding notes)
  const categoriesOnly = Object.fromEntries(
    Object.entries(currentResponse).filter(([key]) => key !== 'notes')
  );

  try {
    await axios.post(`${API_BASE_URL}/api/submit`, {
      project: projectSlug,
      coder: coderName,
      video_id: videoId,
      categories: categoriesOnly,
      notes: currentResponse.notes || ""
    });
    alert('Response submitted successfully.');
  } catch (err) {
    console.error('Submit error:', err);
    alert('Submission failed.');
  }
};


  return (
    <div className="px-4 py-3 d-flex flex-column position-relative" style={{ width: '100%', height: '100%' }}>
      <div className="position-absolute end-0 top-0 mt-2 me-3">
        <Button size="sm" variant="outline-primary" onClick={() => setShowProjectEditor(true)}>
          Edit Codebook
        </Button>
      </div>

      {/* Category blocks */}
      {Object.entries(categories).map(([cat, options]) => (
        <div key={cat} className="mb-3">
          <label className="form-label fw-semibold">{cat}</label>

          <div className="d-flex flex-wrap gap-2 mb-2">
            {options?.length > 0 && options.map((tagObj, idx) => {
              const tag = typeof tagObj === 'string' ? tagObj : tagObj.tag;
              const isSelected = currentResponse[cat]?.includes(tag);
              const inputId = `${cat}-${tag}-${idx}`;

              return (
                <div key={tag}>
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={inputId}
                    autoComplete="off"
                    checked={isSelected}
                    onChange={() => {
                      if (!coderName.trim()) return setShowWarning(true);
                      const current = currentResponse[cat] || [];
                      const updated = isSelected
                        ? current.filter((t) => t !== tag)
                        : [...current, tag];
                      updateResponse(cat, updated);
                    }}
                  />

                  <label
                    className="btn btn-outline-primary btn-sm"
                    htmlFor={inputId}
                    style={{ whiteSpace: 'nowrap', minWidth: 'fit-content', paddingTop: '0.375rem', paddingBottom: '0.375rem' }}
                  >
                    {tag}
                  </label>
                </div>
              );
            })}

            {/* Add new tag inline */}
            <label className="btn btn-outline-secondary btn-sm d-flex align-items-center" style={{ minWidth: 'fit-content', paddingTop: '0.375rem', paddingBottom: '0.375rem' }}>
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 m-0 shadow-none"
                placeholder="+ Add new tag"
                style={{ width: '8rem', fontSize: '0.8rem', minHeight: 'auto', height: 'auto', lineHeight: '1.25rem' }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const newTag = e.target.value.trim();
                    if (!newTag) return;
                    try {
                      await axios.post(`${API_BASE_URL}/api/codebook`, {
                        project: projectSlug,
                        category: cat,
                        tag: newTag
                      });
                      addResponseOption(cat, newTag);
                      const current = currentResponse[cat] || [];
                      if (!current.includes(newTag)) {
                        updateResponse(cat, [...current, newTag]);
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
      ))}

      {/* Add new category */}
      <div className="mb-3">
        <Input
          placeholder="+ Add new category"
          className="form-control form-control-sm"
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              const newCat = e.target.value.trim();
              if (newCat && !categories[newCat]) {
                try {
                  await axios.post(`${API_BASE_URL}/api/codebook`, {
                    project: projectSlug,
                    category: newCat
                  });
                  addCategory(newCat);
                  e.target.value = '';
                } catch (err) {
                  console.error('Failed to add category:', err);
                }
              }
            }
          }}
        />
      </div>

      {/* Notes field */}
      <div className="mt-auto">
        <label className="form-label fw-semibold">Notes</label>
        <Textarea
          value={currentResponse.notes || ''}
          onChange={handleNoteChange}
          className="form-control"
          rows={4}
        />

        <div className="text-end mt-3">
          <Button variant="success" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>

      <ProjectEditorModal
        show={showProjectEditor}
        onClose={() => setShowProjectEditor(false)}
        project={project}
        onSave={onSaveProject}
        onDelete={() => {}}
      />
    </div>
  );
}
