import { useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { api } from '../api';
import { Thumb, Uploader, formatSize, useMediaList } from '../components/media';
import { useAdmin } from '../context';

export default function MediaLibrary() {
  const { notify } = useAdmin();
  const [files, reload] = useMediaList();
  const [filter, setFilter] = useState('all');
  const list = (files || []).filter((f) => filter === 'all' || f.type === filter);

  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.name}"? If the website uses it, that spot will go blank.`)) return;
    try {
      await api.deleteMedia(f.name);
      notify('File deleted');
      reload();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const copy = async (f) => {
    try {
      await navigator.clipboard.writeText(f.url);
      notify('Link copied');
    } catch {
      notify(f.url);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Media Library</h1>
        <p>All photos and videos used on the website. Upload here, then pick them anywhere in the panel.</p>
      </div>
      <Uploader onUploaded={reload} />
      <div className="seg seg--spaced">
        {['all', 'image', 'video'].map((f) => (
          <button type="button" key={f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'image' ? 'Photos' : 'Videos'}</button>
        ))}
      </div>
      {!files && <p className="muted">Loading…</p>}
      {files && list.length === 0 && <p className="muted">No files yet.</p>}
      <div className="media-grid media-grid--lg">
        {list.map((f) => (
          <div className="media-card media-card--static" key={f.name}>
            <Thumb src={f.url} />
            <span className="media-card__name" title={f.name}>{f.name}</span>
            <span className="muted small">{formatSize(f.size)}</span>
            <div className="row">
              <button type="button" className="icon-btn" onClick={() => copy(f)} aria-label="Copy link"><Copy size={16} /></button>
              <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(f)} aria-label="Delete"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
