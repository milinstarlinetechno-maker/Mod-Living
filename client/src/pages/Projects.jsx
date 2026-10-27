import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Media } from '../components/Media';
import { EASE, Reveal } from '../components/motion';
import { useContent } from '../context/ContentContext';

export default function Projects() {
  const { projects, projectsPage: page } = useContent();
  const [filter, setFilter] = useState(page.allLabel);
  const shown = projects.filter((p) => p.visible !== false);
  // Filter buttons are built from the categories the admin used.
  const filters = [page.allLabel, ...new Set(shown.map((p) => p.category).filter(Boolean))];
  const list = filter === page.allLabel || !filters.includes(filter) ? shown : shown.filter((p) => p.category === filter);
  return (
    <>
      <section className="page-head">
        <Reveal className="container" y={24}>
          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1>{page.title}</h1>
        </Reveal>
      </section>
      <section className="section">
        <div className="container">
          {filters.length > 2 && (
            <div className="filters">
              {filters.map((f) => (
                <button key={f} className={f === filter ? 'is-active' : ''} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          )}
          {list.length === 0 && <p className="empty">{page.emptyText}</p>}
          <motion.div className="gallery" layout>
            <AnimatePresence mode="popLayout">
              {list.map((p) => (
                <motion.figure
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <div className="gallery__img"><Media src={p.photo} alt={p.title} /></div>
                  <figcaption><span>{p.category}</span>{p.title}</figcaption>
                </motion.figure>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </>
  );
}
