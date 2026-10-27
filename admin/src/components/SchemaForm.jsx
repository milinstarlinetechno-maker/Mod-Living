import { useId, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import { MediaField, Thumb } from './media';

// Renders editable fields from a plain description (see schemas.js).
// Types: text, textarea, number, toggle, select, media, strings, list, section, group.

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" />
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
}

function Wrap({ spec, children, id }) {
  return (
    <div className={`field ${spec.half ? 'field--half' : ''}`}>
      {spec.label && <label htmlFor={id}>{spec.label}</label>}
      {children}
      {spec.help && <p className="help">{spec.help}</p>}
    </div>
  );
}

export function Fields({ fields, value, onChange }) {
  const set = (key) => (v) => onChange({ ...value, [key]: v });
  return (
    <div className="fields">
      {fields.map((f, i) =>
        f.type === 'group'
          ? <Field key={i} spec={f} value={value} onChange={onChange} />
          : <Field key={f.key} spec={f} value={value?.[f.key]} onChange={set(f.key)} />)}
    </div>
  );
}

export function Field({ spec, value, onChange }) {
  const id = useId();
  switch (spec.type) {
    case 'text':
      return (
        <Wrap spec={spec} id={id}>
          <input id={id} value={value ?? ''} list={spec.suggestions ? `${id}-list` : undefined} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
          {spec.suggestions && <datalist id={`${id}-list`}>{spec.suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
        </Wrap>
      );
    case 'textarea':
      return (
        <Wrap spec={spec} id={id}>
          <textarea id={id} rows={spec.rows || 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </Wrap>
      );
    case 'number':
      return (
        <Wrap spec={spec} id={id}>
          <input id={id} type="number" min={spec.min} max={spec.max} step={spec.step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        </Wrap>
      );
    case 'date':
      return (
        <Wrap spec={spec} id={id}>
          <div className="row">
            <input id={id} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
            {value && <button type="button" className="btn btn--small" onClick={() => onChange('')}>Clear</button>}
          </div>
        </Wrap>
      );
    case 'select':
      return (
        <Wrap spec={spec} id={id}>
          <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {spec.options.map((o) => {
              const opt = typeof o === 'string' ? { value: o, label: o } : o;
              return <option key={opt.value} value={opt.value}>{opt.label}</option>;
            })}
          </select>
        </Wrap>
      );
    case 'toggle':
      return (
        <div className="field field--toggle">
          <Toggle checked={value} onChange={onChange} label={spec.label} />
          {spec.help && <p className="help">{spec.help}</p>}
        </div>
      );
    case 'media':
      return (
        <Wrap spec={spec}>
          <MediaField value={value} onChange={onChange} accept={spec.accept} contain={spec.contain} />
        </Wrap>
      );
    case 'strings':
      return <Strings spec={spec} value={value || []} onChange={onChange} />;
    case 'list':
      return <List spec={spec} value={value || []} onChange={onChange} />;
    case 'section':
    case 'group': // a group edits the parent object directly, a section edits its own key
      return <Section spec={spec} value={value || {}} onChange={onChange} />;
    default:
      return null;
  }
}

// A card for one part of the website, optionally with a "show this section" switch.
export function Section({ spec, value, onChange }) {
  const [open, setOpen] = useState(spec.open !== false);
  const toggleKey = spec.toggleKey;
  const hidden = toggleKey && value[toggleKey] === false;
  if (!spec.title) return <div className="stack"><Fields fields={spec.fields} value={value} onChange={onChange} /></div>;
  return (
    <section className={`card ${hidden ? 'is-hidden' : ''}`}>
      <header className="card__head">
        <button type="button" className="card__title" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <span>{spec.title}</span>
        </button>
        {toggleKey && <Toggle checked={value[toggleKey] !== false} onChange={(v) => onChange({ ...value, [toggleKey]: v })} label={spec.toggleLabel || 'Show on website'} />}
      </header>
      {spec.description && open && <p className="card__desc">{spec.description}</p>}
      {open && <Fields fields={spec.fields} value={value} onChange={onChange} />}
    </section>
  );
}

function Strings({ spec, value, onChange }) {
  const update = (i, v) => onChange(value.map((x, n) => (n === i ? v : x)));
  return (
    <div className="field">
      {spec.label && <label>{spec.label}</label>}
      <div className="strings">
        {value.map((s, i) => (
          <div className="strings__row" key={i}>
            <input value={s} onChange={(e) => update(i, e.target.value)} aria-label={`${spec.label} ${i + 1}`} />
            <button type="button" className="icon-btn" onClick={() => onChange(value.filter((_, n) => n !== i))} aria-label="Remove"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn--small" onClick={() => onChange([...value, ''])}><Plus size={14} /> {spec.addLabel || 'Add'}</button>
      {spec.help && <p className="help">{spec.help}</p>}
    </div>
  );
}

const newId = () => Math.random().toString(36).slice(2, 8);

function List({ spec, value, onChange }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(new Set());
  };
  const update = (i, v) => onChange(value.map((x, n) => (n === i ? v : x)));
  const add = () => {
    onChange([...value, { ...(spec.newItem ? spec.newItem() : {}), ...(spec.idKey ? { [spec.idKey]: newId() } : {}) }]);
    setOpen(new Set([value.length]));
  };
  const dup = (i) => {
    const copy = { ...value[i], ...(spec.idKey ? { [spec.idKey]: newId() } : {}) };
    onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)]);
    setOpen(new Set());
  };
  const remove = (i) => {
    if (!window.confirm('Remove this item?')) return;
    onChange(value.filter((_, n) => n !== i));
    setOpen(new Set());
  };

  return (
    <div className={`field ${spec.card ? 'list-card' : ''}`}>
      {spec.label && <label>{spec.label}</label>}
      {spec.help && <p className="help">{spec.help}</p>}
      <div className="list">
        {value.length === 0 && <p className="muted">{spec.emptyText || 'Nothing added yet.'}</p>}
        {value.map((item, i) => {
          const isOpen = open.has(i);
          const thumb = spec.thumbKey && item[spec.thumbKey];
          const hiddenItem = spec.hideKey && item[spec.hideKey] === false;
          return (
            <div className={`list__item ${hiddenItem ? 'is-hidden' : ''}`} key={item[spec.idKey] || i}>
              <div className="list__head">
                <button type="button" className="list__title" onClick={() => toggle(i)} aria-expanded={isOpen}>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {spec.thumbKey && <Thumb src={thumb} className="thumb--sm" />}
                  <span>{(spec.itemTitle ? spec.itemTitle(item, i) : `Item ${i + 1}`) || `Item ${i + 1}`}</span>
                </button>
                <div className="list__actions">
                  {spec.hideKey && <Toggle checked={item[spec.hideKey] !== false} onChange={(v) => update(i, { ...item, [spec.hideKey]: v })} label="Show" />}
                  <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={16} /></button>
                  <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down"><ArrowDown size={16} /></button>
                  {spec.duplicate && <button type="button" className="icon-btn" onClick={() => dup(i)} aria-label="Duplicate"><Copy size={16} /></button>}
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(i)} aria-label="Remove"><Trash2 size={16} /></button>
                </div>
              </div>
              {isOpen && <div className="list__body"><Fields fields={spec.fields} value={item} onChange={(v) => update(i, v)} /></div>}
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn--small" onClick={add}><Plus size={14} /> {spec.addLabel || 'Add item'}</button>
    </div>
  );
}
