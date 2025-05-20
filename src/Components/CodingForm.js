import React from 'react';
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { TrashFill, PencilFill } from 'react-bootstrap-icons';

export default function CodingForm({
categories,
currentResponse,
coderName,
setShowWarning,
addResponseOption,
addCategory,
updateResponse,
handleNoteChange,
}) {
return (
    <div className="px-4 py-3 d-flex flex-column" style={{ width: '100%', height: '100%' }}>

    {/* Category blocks */}
    {Object.entries(categories).map(([cat, options]) => (
        <div key={cat} className="mb-3">
        <label className="form-label fw-semibold">{cat}</label>

        <div className="d-flex flex-wrap gap-2 mb-2">
            {options.length > 0 &&
            options.map((tag, idx) => {
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
                    className="btn btn-outline-primary btn-sm d-flex justify-content-between align-items-center gap-2"
                    htmlFor={inputId}
                    style={{
                        whiteSpace: 'nowrap',
                        minWidth: 'fit-content',
                        paddingTop: '0.375rem',
                        paddingBottom: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    >
                    <span className="flex-grow-1">{tag}</span>
                    <span className="d-flex gap-1">

                        {/* Edit button with icon */}
                        <button
                        type="button"
                        className="border-0 bg-transparent p-0 m-0 d-flex align-items-center"
                        style={{ lineHeight: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const newVal = prompt(`Edit tag "${tag}":`, tag);
                            if (newVal && newVal !== tag) {
                            addResponseOption(cat, tag, false, newVal);
                            }
                        }}
                        >
                        <PencilFill size={16} />
                        </button>

                        {/* Delete button with icon */}
                        <button
                        type="button"
                        className="border-0 bg-transparent p-0 m-0 d-flex align-items-center"
                        style={{ lineHeight: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove "${tag}" from all responses in "${cat}"?`)) {
                            addResponseOption(cat, tag, true);
                            }
                        }}
                        >
                        <TrashFill size={16} />
                        </button>

                    </span>
                    </label>
                </div>
                );
            })}

            {/* Add new tag inline */}
            <label
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            style={{
                minWidth: 'fit-content',
                paddingTop: '0.375rem',
                paddingBottom: '0.375rem',
                display: 'flex',
                alignItems: 'center',
            }}
            >
            <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 m-0 shadow-none"
                placeholder="+ Add new tag"
                style={{
                width: '8rem',
                fontSize: '0.8rem',
                minHeight: 'auto',
                height: 'auto',
                lineHeight: '1.25rem',
                }}
                onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    const newTag = e.target.value.trim();
                    if (!newTag) return;
                    addResponseOption(cat, newTag);
                    const current = currentResponse[cat] || [];
                    if (!current.includes(newTag)) {
                    updateResponse(cat, [...current, newTag]);
                    }
                    e.target.value = '';
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
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
            const newCat = e.target.value.trim();
            if (newCat && !categories[newCat]) {
                addCategory(newCat);
                e.target.value = '';
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
    </div>
    </div>
);
}
