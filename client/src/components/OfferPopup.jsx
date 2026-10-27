import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Media, SmartLink } from './Media';
import { useContent } from '../context/ContentContext';

const SEEN_KEY = 'modliving:offer-seen';
const today = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

// Festival / offer banner managed from Admin > Offer Banner. It opens over the website every
// time the site is opened or refreshed, until the visitor closes it with the X.
export default function OfferPopup() {
  const { offer } = useContent();
  const day = today();
  const live = Boolean(
    offer?.enabled &&
      (offer.image || offer.title || offer.text) &&
      (!offer.startDate || day >= offer.startDate) &&
      (!offer.endDate || day <= offer.endDate),
  );
  const stamp = JSON.stringify(offer);
  const alreadySeen = () => {
    if (offer?.frequency !== 'session') return false;
    try {
      return sessionStorage.getItem(SEEN_KEY) === stamp;
    } catch {
      return false;
    }
  };
  const [open, setOpen] = useState(() => live && !alreadySeen());

  const close = () => {
    setOpen(false);
    try {
      if (offer.frequency === 'session') sessionStorage.setItem(SEEN_KEY, stamp);
    } catch {
      /* storage unavailable */
    }
  };

  // Keep the page behind the banner from scrolling while it is open; Esc closes it.
  useEffect(() => {
    if (!open || !live) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const hasText = offer?.title || offer?.text || offer?.buttonLabel;
  return (
    <AnimatePresence>
      {open && live && (
        <motion.div className="offer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} role="dialog" aria-modal="true" aria-label={offer.title || 'Offer'}>
          <motion.div
            className="offer__box"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="offer__close" onClick={close} aria-label="Close offer"><X size={20} /></button>
            {offer.image && <div className="offer__img"><Media src={offer.image} alt={offer.title} loading="eager" /></div>}
            {hasText && (
              <div className="offer__text">
                {offer.title && <h2>{offer.title}</h2>}
                {offer.text && <p>{offer.text}</p>}
                {offer.buttonLabel && <SmartLink to={offer.buttonLink || '/contact'} className="btn" onClick={close}>{offer.buttonLabel}</SmartLink>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
