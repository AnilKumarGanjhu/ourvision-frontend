import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css'; // ✅ Make sure CSS import hai

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Delete", 
  cancelText = "Cancel" 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="custom-confirm-backdrop" 
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="custom-confirm-dialog">
        <div className="custom-confirm-icon">
          <AlertTriangle size={44} color="#d84f4f" />
        </div>
        <h3 className="custom-confirm-title">{title || "Are you sure?"}</h3>
        <p className="custom-confirm-message">{message || "This action cannot be undone."}</p>
        <div className="custom-confirm-actions">
          <button className="custom-confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="custom-confirm-delete" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}