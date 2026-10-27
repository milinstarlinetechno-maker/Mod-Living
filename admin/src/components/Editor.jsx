import { useEffect, useMemo, useState } from 'react';
import { Save, Undo2 } from 'lucide-react';
import { api } from '../api';
import { useAdmin } from '../context';
import { Field } from './SchemaForm';

// Edits one or more top-level content keys and saves the ones that changed.
export default function Editor({ page }) {
  const { content, setContent, notify } = useAdmin();
  const keys = page.parts.map((p) => p.key);
  const pick = () => Object.fromEntries(keys.map((k) => [k, structuredClone(content[k])]));
  const [draft, setDraft] = useState(pick);
  const [saved, setSaved] = useState(() => JSON.stringify(pick()));
  const [busy, setBusy] = useState(false);

  const dirtyKeys = useMemo(() => keys.filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(JSON.parse(saved)[k])), [draft, saved]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = dirtyKeys.length > 0;

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    setBusy(true);
    try {
      let latest = content;
      for (const k of dirtyKeys) latest = (await api.saveSection(k, draft[k])).content;
      setContent(latest);
      setSaved(JSON.stringify(Object.fromEntries(keys.map((k) => [k, draft[k]]))));
      notify('Saved. The website is updated.');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const discard = () => setDraft(JSON.parse(saved));

  return (
    <>
      <div className="page-head">
        <h1>{page.title}</h1>
        {page.description && <p>{page.description}</p>}
      </div>
      <div className="stack">
        {page.parts.map((p) => (
          <Field key={p.key} spec={p.spec} value={draft[p.key]} onChange={(v) => setDraft((d) => ({ ...d, [p.key]: v }))} />
        ))}
      </div>
      <div className={`savebar ${dirty ? 'is-dirty' : ''}`}>
        <span>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <div className="row">
          <button type="button" className="btn" onClick={discard} disabled={!dirty || busy}><Undo2 size={16} /> Discard</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={!dirty || busy}><Save size={16} /> {busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </>
  );
}
