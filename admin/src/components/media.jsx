import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Film, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { api } from '../api';
import { useAdmin } from '../context';

export const isVideoUrl = (src = '') => /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i.test(src);

export function Thumb({ src, className = '' }) {
  if (!src) return <div className={`thumb thumb--empty ${className}`}><ImageIcon size={22} /></div>;
  return (
    <div className={`thumb ${className}`}>
      {isVideoUrl(src) ? <video src={src} muted preload="metadata" /> : <img src={src} alt="" loading="lazy" />}
      {isVideoUrl(src) && <span className="thumb__badge"><Film size={12} /></span>}
    </div>
  );
}

export const formatSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Upload button + drag & drop. Calls onUploaded with the new files.
export function Uploader({ onUploaded, children }) {
  const { notify } = useAdmin();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const send = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const done = await api.uploadMedia(files);
      notify(`${done.length} file${done.length > 1 ? 's' : ''} uploaded`);
      onUploaded(done);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div
      className={`dropzone ${over ? 'is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); send(e.dataTransfer.files); }}
    >
      <input ref={input} type="file" multiple hidden accept="image/*,video/mp4,video/webm,video/quicktime" onChange={(e) => send(e.target.files)} />
      <button type="button" className="btn btn--primary" disabled={busy} onClick={() => input.current.click()}>
        <Upload size={16} /> {busy ? 'Uploading…' : 'Upload files'}
      </button>
      <span className="muted">or drop photos / videos here</span>
      {children}
    </div>
  );
}

export function useMediaList() {
  const { notify } = useAdmin();
  const [files, setFiles] = useState(null);
  const reload = useCallback(() => api.listMedia().then(setFiles).catch((e) => notify(e.message, 'error')), [notify]);
  useEffect(() => { reload(); }, [reload]);
  return [files, reload];
}

// Modal to pick (or upload) a photo / video from the library.
export function MediaPicker({ accept = 'any', onPick, onClose }) {
  const [files, reload] = useMediaList();
  const [filter, setFilter] = useState(accept === 'any' ? 'all' : accept);
  const list = (files || []).filter((f) => filter === 'all' || f.type === filter);

  return (
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__box">
        <header className="modal__head">
          <h3>Choose a file</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="modal__tools">
          <Uploader onUploaded={(done) => { reload(); if (done.length === 1) onPick(done[0].url); }} />
          {accept === 'any' && (
            <div className="seg">
              {['all', 'image', 'video'].map((f) => (
                <button type="button" key={f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'image' ? 'Photos' : 'Videos'}</button>
              ))}
            </div>
          )}
        </div>
        <div className="modal__body">
          {!files && <p className="muted">Loading…</p>}
          {files && list.length === 0 && <p className="muted">Nothing here yet. Upload a file above.</p>}
          <div className="media-grid">
            {list.map((f) => (
              <button type="button" key={f.name} className="media-card" onClick={() => onPick(f.url)}>
                <Thumb src={f.url} />
                <span className="media-card__name">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// A field that holds a photo / video URL.
export function MediaField({ value, onChange, accept = 'any', contain = false }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="media-field">
      <Thumb src={value} className={contain ? 'thumb--contain' : ''} />
      <div className="media-field__side">
        <div className="row">
          <button type="button" className="btn" onClick={() => setOpen(true)}><ImageIcon size={15} /> {value ? 'Change' : 'Choose / Upload'}</button>
          {value && <button type="button" className="btn btn--ghost" onClick={() => onChange('')}><Trash2 size={15} /> Remove</button>}
        </div>
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a link (https://…)" aria-label="File link" />
      </div>
      {open && <MediaPicker accept={accept} onPick={(url) => { onChange(url); setOpen(false); }} onClose={() => setOpen(false)} />}
    </div>
  );
}

export const CheckIcon = Check;
