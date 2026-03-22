"use client";
import { Trash2, X } from "lucide-react";

interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  noteName: string;
}

export default function DeleteModal({
  onConfirm,
  onCancel,
  noteName,
}: DeleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onCancel}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-title-wrapper">
          <div className="modal-icon modal-icon--danger">
            <Trash2 size={18} />
          </div>
          <h3 className="modal-title">Delete note?</h3>
        </div>
        <p className="modal-desc">
          <strong>&quot;{noteName}&quot;</strong> will be permanently deleted.
          This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--danger" onClick={onConfirm}>
            Delete
          </button>
          <button className="modal-btn modal-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
