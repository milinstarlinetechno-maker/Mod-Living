import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ICONS } from '../components/icons';
import { Media, SmartLink, isVideo } from '../components/Media';
import { EASE, ImageReveal, Item, Reveal, SplitText, Stagger } from '../components/motion';
import { useContent } from '../context/ContentContext';

function Hero({ hero }) {
  const ref = useRef(null);
  const slides = hero.slides.filter((s) => s.src);
  const slideMs = Math.max(2, Number(hero.slideSeconds) || 5.5) * 1000;
  const [slide, setSlide] = useState(0);

  // Auto-rotate; the timer restarts whenever the slide changes.
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setTimeout(() => setSlide((s) => (s + 1) % slides.length), slideMs);
    return () => clearTimeout(t);
  }, [slide, slides.length, slideMs]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // A soft spotlight follows the cursor across the hero.
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const gradFrom = Number(hero.gradientFromWord) > 0 ? Number(hero.gradientFromWord) - 1 : Infinity;

  return (
    <section className="hero" ref={ref} onMouseMove={onMove}>
      <motion.div className="hero__bg" style={{ y }} aria-hidden="true">
        {slides.map((s, i) => (
          <motion.div
            key={`${s.src}-${i}`}
            className="hero__slide"
            style={isVideo(s.src) ? undefined : { backgroundImage: `url('${s.src}')` }}
            initial={false}
            animate={{ opacity: i === slide ? 1 : 0, scale: i === slide ? 1.1 : 1 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: i === slide ? slideMs / 1000 + 1.5 : 1.4, ease: 'linear' } }}
          >
            {isVideo(s.src) && <video className="hero__video" src={s.src} autoPlay muted loop playsInline preload="metadata" />}
          </motion.div>
        ))}
      </motion.div>
      <div className="hero__shade" />
      <div className="hero__orbs" aria-hidden="true"><span /><span /><span /></div>
      <div className="hero__spot" aria-hidden="true" />
      <motion.div className="container hero__content" style={{ y: textY, opacity: fade }}>
        {hero.eyebrow && (
          <motion.p className="eyebrow eyebrow--light" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.3, ease: EASE }}>
            {hero.eyebrow}
          </motion.p>
        )}
        <SplitText key={hero.title} text={hero.title} className="hero__title" delay={0.4} gradFrom={gradFrom} />
        {hero.subtitle && (
          <motion.p className="hero__sub" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.1, ease: EASE }}>
            {hero.subtitle}
          </motion.p>
        )}
        {hero.buttonLabel && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.3, ease: EASE }}>
            <SmartLink to={hero.buttonLink} className="btn">{hero.buttonLabel} <ArrowRight size={18} /></SmartLink>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

// Low-opacity photos that crossfade slowly behind the call-to-action.
function CtaBackground({ images }) {
  const list = images.filter((s) => s.src);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (list.length < 2) return undefined;
    const t = setTimeout(() => setI((n) => (n + 1) % list.length), 5000);
    return () => clearTimeout(t);
  }, [i, list.length]);
  return (
    <div className="cta__bg" aria-hidden="true">
      {list.map((s, n) => (
        <motion.div
          key={`${s.src}-${n}`}
          style={isVideo(s.src) ? undefined : { backgroundImage: `url('${s.src}')` }}
          initial={false}
          animate={{ opacity: n === i ? 1 : 0, scale: n === i ? 1.08 : 1 }}
          transition={{ opacity: { duration: 1.6 }, scale: { duration: n === i ? 7 : 1.6, ease: 'linear' } }}
        >
          {isVideo(s.src) && <video className="hero__video" src={s.src} autoPlay muted loop playsInline preload="metadata" />}
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const { home, projects } = useContent();
  const { hero, features, services, about, projects: work, cta } = home;
  const latest = projects.filter((p) => p.visible !== false).slice(0, Number(work.count) || 6);

  return (
    <>
      {hero.visible && <Hero hero={hero} />}

      {features.visible && features.items.length > 0 && (
        <Stagger className="features" gap={0.1}>
          {features.items.map(({ icon, title, text }, i) => {
            const Icon = ICONS[icon] || ICONS.Star;
            return (
              <Item key={i} className="feature">
                <span className="feature__icon"><Icon size={24} strokeWidth={1.6} /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </Item>
            );
          })}
        </Stagger>
      )}

      {services.visible && (
        <section className="section" id="services">
          <div className="container">
            <Reveal className="heading">
              {services.eyebrow && <p className="eyebrow">{services.eyebrow}</p>}
              <h2>{services.heading} {services.accent && <span className="grad-text">{services.accent}</span>}</h2>
            </Reveal>
            <Stagger className="cards">
              {services.items.map((c, i) => (
                <Item key={c.id || i} className={`card-wrap ${i % 2 ? 'is-down' : 'is-up'}`}>
                  <SmartLink to={services.cardLink} className="card">
                    <Media src={c.photo} alt={c.name} />
                    <div className="card__text">
                      <h3>{c.name}</h3>
                      <p>{c.text}</p>
                      {services.cardButton && <span className="card__more">{services.cardButton} <ArrowRight size={16} /></span>}
                    </div>
                  </SmartLink>
                </Item>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {about.visible && (
        <section className="section section--tint" id="about">
          <div className="container about">
            <div className="about__media">
              <ImageReveal src={about.image} alt={about.heading} />
              <motion.span
                className="about__frame"
                initial={{ opacity: 0, x: -30, y: -30 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.8, ease: EASE }}
              />
            </div>
            <Stagger className="about__text" gap={0.1}>
              {about.eyebrow && <Item><p className="eyebrow">{about.eyebrow}</p></Item>}
              <Item><h2>{about.heading} {about.accent && <span className="grad-text">{about.accent}</span>}</h2></Item>
              <Item><p>{about.text}</p></Item>
              {about.ticks.length > 0 && (
                <Item>
                  <ul className="ticks">{about.ticks.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </Item>
              )}
              {about.buttonLabel && <Item><SmartLink to={about.buttonLink} className="btn btn--dark">{about.buttonLabel} <ArrowRight size={18} /></SmartLink></Item>}
            </Stagger>
          </div>
        </section>
      )}

      {work.visible && latest.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="heading">
              {work.eyebrow && <p className="eyebrow">{work.eyebrow}</p>}
              <h2>{work.heading} {work.accent && <span className="grad-text">{work.accent}</span>}</h2>
            </Reveal>
            <Stagger className="gallery" gap={0.1}>
              {latest.map((p) => (
                <Item as="figure" key={p.id}>
                  <div className="gallery__img"><Media src={p.photo} alt={p.title} /></div>
                  <figcaption><span>{p.category}</span>{p.title}</figcaption>
                </Item>
              ))}
            </Stagger>
            {work.buttonLabel && <Reveal className="center"><SmartLink to={work.buttonLink} className="btn btn--dark">{work.buttonLabel} <ArrowRight size={18} /></SmartLink></Reveal>}
          </div>
        </section>
      )}

      {cta.visible && (
        <section className="cta">
          <CtaBackground images={cta.images} />
          <Reveal className="container">
            <h2>{cta.heading} {cta.accent && <span className="grad-text">{cta.accent}</span>}</h2>
            <p>{cta.text}</p>
            {cta.buttonLabel && <SmartLink to={cta.buttonLink} className="btn">{cta.buttonLabel} <ArrowRight size={18} /></SmartLink>}
          </Reveal>
        </section>
      )}
    </>
  );
}
