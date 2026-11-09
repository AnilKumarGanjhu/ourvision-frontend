
import React from "react";
import "./ConfirmModal.css";

const icons = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white">
      <path d="M5 13l4 4L19 7" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white">
      <path d="M6 18L18 6M6 6l12 12" strokeWidth="3"
        strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white">
      <path d="M12 9v2m0 4h.01m-6.9 4h13.8c1.5 0 2.5-1.7 1.7-3L13.7 4c-.7-1.3-2.7-1.3-3.4 0L3.3 16c-.8 1.3.2 3 1.7 3z"
        strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 11v5m0-8h.01" strokeWidth="2"
        strokeLinecap="round" />
    </svg>
  )
};

export default function ConfirmModal({
  open,
  type = "warning",
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel = true,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div
      className="alert-overlay active"
      onClick={onCancel}
    >
      <div
        className="alert-modal"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`alert-icon-wrapper ${type}`}>
          {icons[type]}
        </div>

        <h3 className="alert-title">{title}</h3>

        <p className="alert-message">{message}</p>

        <div className="alert-actions">
          {showCancel && (
            <button
              className="alert-btn cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            className={`alert-btn confirm ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
