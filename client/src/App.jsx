import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ArrowRight, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "framer-motion";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import { SmartLink } from "./components/Media";
import OfferPopup from "./components/OfferPopup";
import { useContent } from "./context/ContentContext";

// A link such as "/projects" or "/contact#form" belongs to a page that the admin can switch off.
const isLinkOn = (pages, to = "") => {
  const key = to.split(/[#?]/)[0].replace(/^\//, "");
  return !key || !pages[key] || pages[key].enabled;
};

function setMeta(selector, create, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  if (el.tagName === "LINK") el.href = value;
  else el.content = value;
}

// Page title, description, share image and favicon come from the admin's site settings.
function useHead(site) {
  useEffect(() => {
    document.title = site.metaTitle || site.name;
    const meta = (attr, name) => () =>
      Object.assign(document.createElement("meta"), { [attr]: name });
    setMeta(
      'meta[name="description"]',
      meta("name", "description"),
      site.metaDescription || "",
    );
    setMeta(
      'meta[property="og:title"]',
      meta("property", "og:title"),
      site.metaTitle || site.name,
    );
    setMeta(
      'meta[property="og:description"]',
      meta("property", "og:description"),
      site.metaDescription || "",
    );
    if (site.ogImage)
      setMeta(
        'meta[property="og:image"]',
        meta("property", "og:image"),
        site.ogImage,
      );
    if (site.favicon)
      setMeta(
        'link[rel="icon"]',
        () => Object.assign(document.createElement("link"), { rel: "icon" }),
        site.favicon,
      );
  }, [site]);
}

// Light-background logo in the header, white-text version on the dark footer.
function Logo({ light = false }) {
  const { site } = useContent();
  const src = (light && site.logoLight) || site.logo;
  return (
    <Link to="/" className="logo" aria-label={`${site.name} — home`}>
      {src ? (
        <img src={src} alt={site.name} width="220" height="48" />
      ) : (
        <strong>{site.name}</strong>
      )}
    </Link>
  );
}

function Layout() {
  const { site, pages, nav, headerCta, footer, home } = useContent();
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  useHead(site);

  // Go to the top on page change, or to the #section when one is given.
  useEffect(() => {
    setOpen(false);
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const t = setTimeout(
      () =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
    return () => clearTimeout(t);
  }, [pathname, hash]);

  // Header hides while scrolling down and returns on scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 40);
    setHidden(y > scrollY.getPrevious() && y > 220 && !open);
  });

  const isActive = (to) =>
    to === "/"
      ? pathname === "/" && !hash
      : to.startsWith("/#")
        ? pathname === "/" && hash === to.slice(1)
        : pathname === to;

  const on = (l) => isLinkOn(pages, l.to);
  const headerLinks = nav.filter((l) => l.header && on(l));
  const footerLinks = nav.filter((l) => l.footer && on(l));
  const showCta = headerCta.visible && isLinkOn(pages, headerCta.to);
  const services = home.services.items;

  return (
    <>
      <motion.div className="progress" style={{ scaleX: progress }} />
      <header
        className={`header ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""}`}
      >
        <div className="container header__bar">
          <Logo />
          <nav className={`nav ${open ? "is-open" : ""}`} aria-label="Main">
            {headerLinks.map((l) => (
              <SmartLink
                key={l.id}
                to={l.to}
                className={isActive(l.to) ? "active" : ""}
              >
                {l.label}
              </SmartLink>
            ))}
            {showCta && (
              <SmartLink to={headerCta.to} className="nav__cta-mobile">
                {headerCta.label}
              </SmartLink>
            )}
          </nav>
          {showCta && (
            <SmartLink to={headerCta.to} className="btn header__cta">
              {headerCta.label}
            </SmartLink>
          )}
          <button
            className="menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.main>
      <footer className="footer">
        <div className="container footer__grid">
          <div className="footer__brand">
            <Logo light />
            <p>
              {site.tagline}. {footer.about}
            </p>
            {footer.buttonVisible && isLinkOn(pages, footer.buttonTo) && (
              <SmartLink to={footer.buttonTo} className="footer__btn">
                {footer.buttonLabel} <ArrowRight size={16} />
              </SmartLink>
            )}
          </div>
          <nav className="footer__col" aria-label="Quick links">
            <h3>{footer.quickLinksTitle}</h3>
            {footerLinks.map((l) => (
              <SmartLink key={l.id} to={l.to}>
                {l.label}
              </SmartLink>
            ))}
          </nav>
          {footer.showServices && services.length > 0 && (
            <div className="footer__col">
              <h3>{footer.servicesTitle}</h3>
              {services.map((c) => (
                <SmartLink key={c.id} to={home.services.cardLink}>
                  {c.name}
                </SmartLink>
              ))}
            </div>
          )}
          <div className="footer__col">
            <h3>{footer.contactTitle}</h3>
            {site.phone && (
              <p>
                <Phone size={16} /> {site.phone}
              </p>
            )}
            {site.email && (
              <p>
                <Mail size={16} /> {site.email}
              </p>
            )}
            {site.address && (
              <p>
                <MapPin size={16} /> {site.address}
              </p>
            )}
          </div>
        </div>
        <div className="footer__bottom">
          <div className="container">
            © {new Date().getFullYear()} {site.name}. {footer.copyright}
          </div>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const { pages } = useContent();
  return (
    <MotionConfig reducedMotion="user">
      <OfferPopup />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="projects"
            element={
              pages.projects.enabled ? (
                <Projects />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="contact"
            element={
              pages.contact.enabled ? <Contact /> : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MotionConfig>
  );
}
