import { useState } from 'react';
import { Loader2, MapPin, Navigation, Send } from 'lucide-react';
import { Reveal } from '../components/motion';
import { useContent } from '../context/ContentContext';
import { submitLead } from '../utils/leadService';
import { validateInquiry } from '../utils/validation';
import { buildInquiryMessage, buildWhatsAppUrl } from '../utils/whatsapp';

const EMPTY = { name: '', phone: '', city: '', category: '', message: '' };

export default function Contact() {
  const { site, contact: c } = useContent();
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setV((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
    setSent(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const found = validateInquiry(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    await submitLead(v); // saved for the admin's Leads inbox; WhatsApp opens regardless
    setBusy(false);
    const url = buildWhatsAppUrl(site.whatsapp, buildInquiryMessage(site.name, v));
    if (!window.open(url, '_blank', 'noopener,noreferrer')) window.location.href = url;
    setSent(true);
  };

  const field = (k, label, input) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={k}>{label}</label>
      {input}
      {errors[k] && <p className="field__error" role="alert">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <section className="page-head">
        <Reveal className="container" y={24}>
          {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
          <h1>{c.title}</h1>
        </Reveal>
      </section>
      <section className="section">
        <Reveal className="container contact">
          <div className="contact__info">
            <h2>{c.infoTitle}</h2>
            <p>{c.infoText}</p>
            <dl>
              {site.phone && <><dt>{c.phoneLabel}</dt><dd><a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>{site.phone}</a></dd></>}
              {site.email && <><dt>{c.emailLabel}</dt><dd><a href={`mailto:${site.email}`}>{site.email}</a></dd></>}
              {site.address && <><dt>{c.addressLabel}</dt><dd>{site.address}</dd></>}
              {site.factoryLocation && <><dt>{c.factoryLabel}</dt><dd>{site.factoryLocation}</dd></>}
              {site.hours && <><dt>{c.hoursLabel}</dt><dd>{site.hours}</dd></>}
            </dl>
            {site.mapEmbed && (
              <div className="map">
                {c.mapTitle && <h3><MapPin size={18} /> {c.mapTitle}</h3>}
                <div className="map__frame">
                  <iframe src={site.mapEmbed} title={c.mapTitle || 'Map'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  {/* Tapping the map opens Google Maps (the app on phones) with the route ready to start. */}
                  <a className="map__tap" href={site.mapDirections || site.mapUrl} target="_blank" rel="noopener noreferrer" aria-label={c.mapButton || 'Open in Google Maps'} />
                </div>
                <a className="btn btn--dark map__btn" href={site.mapDirections || site.mapUrl} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> {c.mapButton || 'Open in Google Maps'}</a>
              </div>
            )}
          </div>
          <form className="form" onSubmit={submit} noValidate>
            <div className="form__row">
              {field('name', c.nameLabel, <input id="name" value={v.name} onChange={set('name')} autoComplete="name" />)}
              {field('phone', c.phoneFieldLabel, <input id="phone" type="tel" value={v.phone} onChange={set('phone')} autoComplete="tel" />)}
            </div>
            <div className="form__row">
              {field('city', c.cityLabel, <input id="city" value={v.city} onChange={set('city')} autoComplete="address-level2" />)}
              {field('category', c.categoryLabel, (
                <select id="category" value={v.category} onChange={set('category')}>
                  <option value="">{c.categoryPlaceholder}</option>
                  {c.categories.map((x) => <option key={x}>{x}</option>)}
                </select>
              ))}
            </div>
            {field('message', c.messageLabel, <textarea id="message" rows={4} value={v.message} onChange={set('message')} />)}
            <button type="submit" className="btn" disabled={busy}>{busy ? <Loader2 size={17} className="spin" /> : <Send size={17} />} {c.buttonLabel}</button>
            {sent && <p className="form__ok" role="status">{c.successText}</p>}
          </form>
        </Reveal>
      </section>
    </>
  );
}
