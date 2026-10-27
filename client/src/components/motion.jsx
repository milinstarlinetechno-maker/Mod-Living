import { motion } from 'framer-motion';
import { isVideo } from './Media';

export const EASE = [0.22, 1, 0.36, 1];

// Fades and lifts its children into view once, when scrolled to.
export function Reveal({ children, delay = 0, y = 40, as = 'div', className }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

// Parent that staggers its <Item> children.
export function Stagger({ children, className, gap = 0.12 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className, as = 'div' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 50, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: EASE } },
      }}
    >
      {children}
    </Tag>
  );
}

// Image revealed by a curtain wipe while the picture settles from a zoom.
export function ImageReveal({ src, alt, className }) {
  const media = isVideo(src) ? { as: motion.video, props: { autoPlay: true, muted: true, loop: true, playsInline: true } } : { as: motion.img, props: { alt, loading: 'lazy' } };
  const Tag = media.as;
  return (
    <motion.div
      className={`reveal-img ${className || ''}`}
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.3, ease: EASE }}
    >
      <Tag
        src={src}
        {...media.props}
        initial={{ scale: 1.35 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.8, ease: EASE }}
      />
    </motion.div>
  );
}

// Heading whose words rise out of a mask, one after another.
export function SplitText({ text, className, delay = 0, gradFrom = Infinity }) {
  return (
    <h1 className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span className="split__mask" key={i} aria-hidden="true">
          <motion.span
            className={`split__word ${i >= gradFrom ? 'grad-text' : ''}`}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: delay + i * 0.08, ease: EASE }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
