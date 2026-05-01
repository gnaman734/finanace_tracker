import { createPortal } from 'react-dom';

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
