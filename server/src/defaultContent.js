// Starting content for the website. It is only used until the admin saves
// something: stored content is merged on top of this (see lib/store.js).

export const defaultContent = {
  site: {
    name: 'MOD LIVING',
    tagline: 'Style that hits home',
    phone: '[Phone number — to be provided]',
    email: '[Email address — to be provided]',
    address: '[Showroom / registered address — to be provided]',
    factoryLocation: '[Factory location — to be provided]',
    hours: '[Consultation hours — to be provided]',
    whatsapp: '',
    logo: '/uploads/logo-600.png',
    logoLight: '/uploads/logo-white-600.png',
    favicon: '/uploads/logo-300.png',
    metaTitle: 'MOD LIVING — Modular Kitchens, Wardrobes & Interiors',
    metaDescription:
      'MOD LIVING designs and manufactures modular kitchens, wardrobes, bedrooms and living-space furniture. Style that hits home.',
    ogImage: '/uploads/og-image.jpg',
  },

  // Turning a page off removes it from the menus and its address redirects to Home.
  pages: {
    projects: { enabled: true },
    contact: { enabled: true },
  },

  // Festival / offer pop-up shown over the website every time it opens (until the visitor closes it).
  offer: {
    enabled: false,
    image: '',
    title: '',
    text: '',
    buttonLabel: '',
    buttonLink: '/contact',
    startDate: '',
    endDate: '',
    frequency: 'always', // 'always' = on every open/refresh, 'session' = once per browser session
  },

  nav: [
    { id: 'n1', label: 'Home', to: '/', header: true, footer: true },
    { id: 'n2', label: 'Services', to: '/#services', header: true, footer: true },
    { id: 'n3', label: 'About', to: '/#about', header: true, footer: true },
    { id: 'n4', label: 'Projects', to: '/projects', header: true, footer: true },
    { id: 'n5', label: 'Contact', to: '/contact', header: false, footer: true },
  ],
  headerCta: { visible: true, label: 'Contact Us', to: '/contact' },

  footer: {
    about: 'Modular kitchens, wardrobes and interiors, designed and made around you.',
    buttonVisible: true,
    buttonLabel: 'Book a Consultation',
    buttonTo: '/contact',
    quickLinksTitle: 'Quick Links',
    servicesTitle: 'Services',
    showServices: true,
    contactTitle: 'Contact',
    copyright: 'All rights reserved.',
  },

  home: {
    hero: {
      visible: true,
      eyebrow: 'Modular Kitchens · Wardrobes · Interiors',
      title: 'Interiors designed around the way you live.',
      gradientFromWord: 5,
      subtitle: 'Modular furniture designed and made to fit your home, from the first sketch to the final installation.',
      buttonLabel: 'Book a Consultation',
      buttonLink: '/contact',
      slides: [
        { src: '/uploads/hero-kitchen.jpg' },
        { src: '/uploads/living-warm.jpg' },
        { src: '/uploads/kitchen-island.jpg' },
        { src: '/uploads/bedroom-dark.jpg' },
        { src: '/uploads/living-wood-wall.jpg' },
      ],
      slideSeconds: 5.5,
    },
    features: {
      visible: true,
      items: [
        { icon: 'PencilRuler', title: 'Custom Design', text: 'Planned around your space' },
        { icon: 'ShieldCheck', title: 'Quality Materials', text: 'Durable, lasting finishes' },
        { icon: 'Hammer', title: 'Precise Manufacturing', text: 'Made in our own facility' },
        { icon: 'Truck', title: 'Smooth Installation', text: 'On time, clean and careful' },
      ],
    },
    services: {
      visible: true,
      eyebrow: 'What we make',
      heading: 'Furniture for',
      accent: 'every room',
      cardButton: 'Enquire',
      cardLink: '/contact',
      items: [
        { id: 'kitchen', name: 'Modular Kitchens', text: 'Smart layouts, durable finishes.', photo: '/uploads/kitchen-brass.jpg' },
        { id: 'wardrobe', name: 'Wardrobes', text: 'Sliding, hinged and walk-in.', photo: '/uploads/bedroom-dark.jpg' },
        { id: 'bedroom', name: 'Bedrooms', text: 'Beds, panels and storage.', photo: '/uploads/bedroom-light.jpg' },
        { id: 'living', name: 'Living Spaces', text: 'TV units and display walls.', photo: '/uploads/living-warm.jpg' },
      ],
    },
    about: {
      visible: true,
      eyebrow: 'About us',
      heading: 'Made with care,',
      accent: 'finished with precision',
      text: 'We design and manufacture modular furniture that fits your home and your routine, from the first sketch to the final installation.',
      image: '/uploads/living-neutral.jpg',
      ticks: ['Custom designs for your space', 'Quality materials and finishes', 'Clear planning, smooth installation'],
      buttonLabel: 'Talk to us',
      buttonLink: '/contact',
    },
    projects: {
      visible: true,
      eyebrow: 'Our work',
      heading: 'Latest',
      accent: 'projects',
      count: 6,
      buttonLabel: 'View all projects',
      buttonLink: '/projects',
    },
    cta: {
      visible: true,
      heading: 'Ready to plan',
      accent: 'your space?',
      text: 'Share your idea. We will take it from there.',
      buttonLabel: 'Get Started',
      buttonLink: '/contact',
      images: [{ src: '/uploads/living-warm.jpg' }, { src: '/uploads/kitchen-island.jpg' }, { src: '/uploads/bedroom-dark.jpg' }],
    },
  },

  projectsPage: {
    eyebrow: 'Our work',
    title: 'Projects',
    allLabel: 'All',
    emptyText: 'No projects to show yet.',
  },

  projects: [
    { id: 'p1', category: 'Kitchen', title: 'Olive & Oak Island Kitchen', photo: '/uploads/kitchen-brass.jpg', visible: true },
    { id: 'p2', category: 'Living Space', title: 'Warm Neutral Lounge', photo: '/uploads/living-warm.jpg', visible: true },
    { id: 'p3', category: 'Bedroom', title: 'Sand Panel Bedroom', photo: '/uploads/bedroom-light.jpg', visible: true },
    { id: 'p4', category: 'Kitchen', title: 'Ivory Linear Kitchen', photo: '/uploads/kitchen-white.jpg', visible: true },
    { id: 'p5', category: 'Living Space', title: 'Timber Feature Wall', photo: '/uploads/living-wood-wall.jpg', visible: true },
    { id: 'p6', category: 'Bedroom', title: 'Dark Suite Bedroom', photo: '/uploads/bedroom-dark.jpg', visible: true },
  ],

  contact: {
    eyebrow: 'Contact',
    title: 'Let’s talk about your space',
    infoTitle: 'Get in touch',
    infoText: 'Fill in the form and it opens WhatsApp with your details ready to send.',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    addressLabel: 'Address',
    hoursLabel: 'Hours',
    factoryLabel: 'Factory',
    mapTitle: 'Find our showroom',
    mapButton: 'Open in Google Maps',
    nameLabel: 'Full name',
    phoneFieldLabel: 'Phone',
    cityLabel: 'City',
    categoryLabel: 'Interested in',
    categoryPlaceholder: 'Select…',
    messageLabel: 'Message (optional)',
    buttonLabel: 'Send on WhatsApp',
    successText: 'WhatsApp opened with your message. Press send there to reach us.',
    categories: ['Modular Kitchen', 'Wardrobe', 'Bedroom Furniture', 'TV Unit / Living Space', 'Complete Interior', 'Not sure yet'],
  },
};
