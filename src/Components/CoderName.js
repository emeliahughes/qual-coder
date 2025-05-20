import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Modal, Button } from 'react-bootstrap';

export default function CoderNameInput({
coderName,
setCoderName,
previousCoderName,
setPreviousCoderName,
previousCoders,
showWarningModal,
setShowWarningModal, // ✅ new props
}) {
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [pendingName, setPendingName] = useState('');

useEffect(() => {
    // Clear the warning modal automatically once a valid name is entered
    if (showWarningModal && coderName.trim()) {
    setShowWarningModal(false);
    }
}, [coderName, showWarningModal, setShowWarningModal]);

const handleBlur = () => {
    const trimmedName = coderName.trim();
    if (!trimmedName) return;

    if (previousCoderName && previousCoderName !== trimmedName) {
    setPendingName(trimmedName);
    setShowConfirmModal(true);
    } else {
    setPreviousCoderName(trimmedName);
    }
};

const confirmNameChange = () => {
    setPreviousCoderName(pendingName);
    setCoderName(pendingName);
    setShowConfirmModal(false);
};

const cancelNameChange = () => {
    setCoderName(previousCoderName);
    setPendingName('');
    setShowConfirmModal(false);
};

return (
    <>
    <div className="d-flex align-items-center gap-2 flex-wrap">
        <div className="col" />

        <div className="col d-flex justify-content-end">
        <label htmlFor="coder-name" className="form-label mb-0 text-end">
            Current Coder:
        </label>
        </div>

        <div className="col">
        <Input
            list="previous-coders"
            value={coderName}
            id="coder-name"
            className="form-control form-control-sm"
            onChange={(e) => setCoderName(e.target.value)}
            onBlur={handleBlur}
        />
        <datalist id="previous-coders">
            {previousCoders.map((name) => (
            <option key={name} value={name} />
            ))}
        </datalist>
        </div>

        <div className="col" /> {/* Empty column for layout */}
    </div>

    {/* Modal: Warning about empty coder name */}
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

    {/* Modal: Confirm name change */}
    <Modal show={showConfirmModal} onHide={cancelNameChange} centered>
        <Modal.Header closeButton>
        <Modal.Title>Change Coder Name?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        Changing the coder name will update saved responses. Are you sure you want to proceed?
        </Modal.Body>
        <Modal.Footer>
        <Button variant="secondary" onClick={cancelNameChange}>
            Cancel
        </Button>
        <Button variant="primary" onClick={confirmNameChange}>
            Confirm
        </Button>
        </Modal.Footer>
    </Modal>
    </>
);
}
