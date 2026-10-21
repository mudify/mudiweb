import React from 'react';
import './Toast.css';

export const Toast = ({ message, type = 'info', onClose, toasts, onRemove }) => {
  // Support multiple toasts array mode
  if (toasts && toasts.length > 0) {
    return (
      <div className="toast-container" id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type || 'info'}`}>
            <span className="material-symbols-outlined toast-icon">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            <div className="toast-body">
              {t.title && <span className="toast-title">{t.title}</span>}
              <span className="toast-message">{t.message}</span>
            </div>
            <button className="toast-close" onClick={() => onRemove && onRemove(t.id)}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Support single toast mode
  if (!message) return null;

  return (
    <div className="toast-container" id="toast-container">
      <div className={`toast-card toast-${type}`}>
        <span className="material-symbols-outlined toast-icon">
          {type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
        </span>
        <div className="toast-body">
          <span className="toast-message">{message}</span>
        </div>
        {onClose && (
          <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
