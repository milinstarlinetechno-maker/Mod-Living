// Describes every editable thing on the website. SchemaForm turns these into forms.
// Each page lists `parts`: a part edits one top-level key of the site content.

const LINKS = ['/', '/#services', '/#about', '/projects', '/contact', 'https://', 'tel:+91', 'mailto:'];
const text = (key, label, extra = {}) => ({ type: 'text', key, label, ...extra });
const area = (key, label, extra = {}) => ({ type: 'textarea', key, label, ...extra });
const link = (key, label = 'Button link', help) => ({ type: 'text', key, label, half: true, suggestions: LINKS, help: help || 'Page like /contact, a section like /#about, or a full link (https://…, tel:…, mailto:…).' });
const media = (key, label, accept = 'any', help, contain = false) => ({ type: 'media', key, label, accept, help, contain });

export const ICON_OPTIONS = ['PencilRuler', 'ShieldCheck', 'Hammer', 'Truck', 'Award', 'BadgeCheck', 'Clock', 'Heart', 'Home', 'Leaf', 'Ruler', 'Sparkles', 'Star', 'ThumbsUp', 'Wrench'];

const heading = [text('heading', 'Heading', { half: true }), text('accent', 'Coloured part of heading', { half: true, help: 'Shown in the brand gradient after the heading.' })];

export const sitePage = {
  title: 'Site Settings',
  description: 'Business details, logo and how the website appears on Google and when shared.',
  parts: [
    {
      key: 'site',
      spec: {
        type: 'group',
        title: 'Business details',
        description: 'Shown in the footer, contact page and WhatsApp message. The map is set on the Contact & Map page.',
        fields: [
          text('name', 'Business name', { half: true }),
          text('tagline', 'Tagline', { half: true }),
          text('phone', 'Phone number', { half: true }),
          text('email', 'Email', { half: true }),
          area('address', 'Showroom / registered address', { rows: 2 }),
          text('factoryLocation', 'Factory location', { half: true }),
          text('hours', 'Consultation hours', { half: true }),
          text('whatsapp', 'WhatsApp number', { help: 'Digits only with country code, e.g. 919876543210. Contact form messages open on this number.' }),
          {
            type: 'group',
            title: 'Logo & icon',
            fields: [
              media('logo', 'Logo (for light background, header)', 'image', undefined, true),
              media('logoLight', 'Logo (white, for dark footer)', 'image', undefined, true),
              media('favicon', 'Browser tab icon', 'image', undefined, true),
            ],
          },
          {
            type: 'group',
            title: 'Google & sharing (SEO)',
            fields: [
              text('metaTitle', 'Page title'),
              area('metaDescription', 'Description', { rows: 3 }),
              media('ogImage', 'Share image (WhatsApp / social previews)', 'image'),
            ],
          },
        ],
      },
    },
  ],
};

export const menuPage = {
  title: 'Pages & Menu',
  description: 'Switch whole pages on or off, and control the menu and footer links.',
  parts: [
    {
      key: 'pages',
      spec: {
        type: 'group',
        title: 'Pages',
        description: 'A page that is switched off disappears from the menus and its address goes back to the Home page. The Home page is always on.',
        fields: [
          { type: 'section', key: 'projects', title: 'Projects page', toggleKey: 'enabled', toggleLabel: 'Page is live', fields: [], open: false },
          { type: 'section', key: 'contact', title: 'Contact page', toggleKey: 'enabled', toggleLabel: 'Page is live', fields: [], open: false },
        ],
      },
    },
    {
      key: 'nav',
      spec: {
        type: 'list',
        label: 'Menu links',
        card: true,
        help: 'Links shown in the website header and footer. Use the arrows to change the order.',
        idKey: 'id',
        addLabel: 'Add link',
        itemTitle: (i) => `${i.label || 'New link'}  →  ${i.to}`,
        newItem: () => ({ label: '', to: '/', header: true, footer: true }),
        fields: [
          text('label', 'Link text', { half: true }),
          link('to', 'Goes to'),
          { type: 'toggle', key: 'header', label: 'Show in header menu' },
          { type: 'toggle', key: 'footer', label: 'Show in footer' },
        ],
      },
    },
    {
      key: 'headerCta',
      spec: {
        type: 'group',
        title: 'Header button',
        fields: [{ type: 'toggle', key: 'visible', label: 'Show button in header' }, text('label', 'Button text', { half: true }), link('to', 'Goes to')],
      },
    },
    {
      key: 'footer',
      spec: {
        type: 'group',
        title: 'Footer',
        fields: [
          area('about', 'Text under the logo', { rows: 2, help: 'The tagline is shown first, then this text.' }),
          { type: 'toggle', key: 'buttonVisible', label: 'Show footer button' },
          text('buttonLabel', 'Footer button text', { half: true }),
          link('buttonTo', 'Footer button goes to'),
          text('quickLinksTitle', 'Heading: quick links', { half: true }),
          text('servicesTitle', 'Heading: services', { half: true }),
          text('contactTitle', 'Heading: contact', { half: true }),
          text('copyright', 'Copyright text', { half: true, help: '"© year Business name." is added before this.' }),
          { type: 'toggle', key: 'showServices', label: 'Show services list in footer' },
        ],
      },
    },
  ],
};

const section = (key, title, fields, extra = {}) => ({ type: 'section', key, title, toggleKey: 'visible', toggleLabel: 'Show on website', fields, open: false, ...extra });

export const homePage = {
  title: 'Home Page',
  description: 'Every section of the home page. Open a section to edit it, or switch it off to hide it.',
  parts: [
    {
      key: 'home',
      spec: {
        type: 'group',
        fields: [
          section('hero', 'Top banner (hero)', [
            text('eyebrow', 'Small line above title'),
            text('title', 'Main title'),
            { type: 'number', key: 'gradientFromWord', label: 'Colour the title from word number', half: true, min: 0, help: 'e.g. 5 colours the 5th word to the end. 0 = no colour.' },
            area('subtitle', 'Sub text', { rows: 2 }),
            text('buttonLabel', 'Button text', { half: true }),
            link('buttonLink'),
            {
              type: 'list',
              key: 'slides',
              label: 'Background photos / videos',
              help: 'They change automatically one after another.',
              addLabel: 'Add photo / video',
              thumbKey: 'src',
              itemTitle: (s, i) => `Background ${i + 1}`,
              newItem: () => ({ src: '' }),
              fields: [media('src', 'Photo or video')],
            },
            { type: 'number', key: 'slideSeconds', label: 'Seconds per background', half: true, min: 2, max: 30, step: 0.5 },
          ], { open: true }),
          section('features', 'Feature strip (4 icons below banner)', [
            {
              type: 'list',
              key: 'items',
              label: 'Features',
              addLabel: 'Add feature',
              itemTitle: (i) => i.title,
              newItem: () => ({ icon: 'Star', title: '', text: '' }),
              fields: [{ type: 'select', key: 'icon', label: 'Icon', options: ICON_OPTIONS }, text('title', 'Title'), text('text', 'Text')],
            },
          ]),
          section('services', 'What we make (service cards)', [
            text('eyebrow', 'Small line above heading'),
            ...heading,
            text('cardButton', 'Card button text', { half: true, help: 'Leave empty to hide.' }),
            link('cardLink', 'Cards go to'),
            {
              type: 'list',
              key: 'items',
              label: 'Cards',
              idKey: 'id',
              addLabel: 'Add card',
              thumbKey: 'photo',
              itemTitle: (i) => i.name,
              newItem: () => ({ name: '', text: '', photo: '' }),
              fields: [text('name', 'Title'), text('text', 'Short text'), media('photo', 'Photo or video')],
            },
          ]),
          section('about', 'About us', [
            text('eyebrow', 'Small line above heading'),
            ...heading,
            area('text', 'Paragraph', { rows: 4 }),
            media('image', 'Photo or video'),
            { type: 'strings', key: 'ticks', label: 'Tick points', addLabel: 'Add point' },
            text('buttonLabel', 'Button text', { half: true, help: 'Leave empty to hide the button.' }),
            link('buttonLink'),
          ]),
          section('projects', 'Latest projects', [
            text('eyebrow', 'Small line above heading'),
            ...heading,
            { type: 'number', key: 'count', label: 'How many projects to show', half: true, min: 1, max: 24, help: 'The projects themselves are managed on the Projects page in this panel.' },
            text('buttonLabel', 'Button text', { half: true, help: 'Leave empty to hide the button.' }),
            link('buttonLink'),
          ]),
          section('cta', 'Call to action (bottom banner)', [
            ...heading,
            text('text', 'Sub text'),
            text('buttonLabel', 'Button text', { half: true }),
            link('buttonLink'),
            {
              type: 'list',
              key: 'images',
              label: 'Background photos / videos',
              addLabel: 'Add photo / video',
              thumbKey: 'src',
              itemTitle: (s, i) => `Background ${i + 1}`,
              newItem: () => ({ src: '' }),
              fields: [media('src', 'Photo or video')],
            },
          ]),
        ],
      },
    },
  ],
};

export const projectsPage = (content) => ({
  title: 'Projects',
  description: 'Your project gallery. Add photos or videos, set the category, hide or reorder them.',
  parts: [
    {
      key: 'projects',
      spec: {
        type: 'list',
        label: 'Projects',
        card: true,
        help: 'The website builds the category filter buttons from the categories you type here.',
        idKey: 'id',
        hideKey: 'visible',
        thumbKey: 'photo',
        duplicate: true,
        addLabel: 'Add project',
        emptyText: 'No projects yet.',
        itemTitle: (i) => (i.title ? `${i.title}${i.category ? ` — ${i.category}` : ''}` : ''),
        newItem: () => ({ title: '', category: '', photo: '', visible: true }),
        fields: [
          text('title', 'Project name'),
          text('category', 'Category', { suggestions: [...new Set(content.projects.map((p) => p.category).filter(Boolean))], help: 'e.g. Kitchen, Bedroom. Same spelling groups projects together.' }),
          media('photo', 'Photo or video'),
        ],
      },
    },
    {
      key: 'projectsPage',
      spec: {
        type: 'group',
        title: 'Projects page heading',
        open: false,
        fields: [text('eyebrow', 'Small line above title', { half: true }), text('title', 'Page title', { half: true }), text('allLabel', 'Label of the "All" filter', { half: true }), text('emptyText', 'Text when there are no projects', { half: true })],
      },
    },
  ],
});

export const contactPage = {
  title: 'Contact & Map',
  description: 'Phone, email, address and Google Map shown on the Contact page and footer, plus the page texts and form labels. Enquiries are saved under Leads and also open on WhatsApp.',
  parts: [
    {
      key: 'site',
      spec: {
        type: 'group',
        title: 'Contact details & map',
        description: 'These are shown on the Contact page and in the website footer.',
        fields: [
          text('phone', 'Phone number', { half: true, help: 'Tapping it on a phone starts a call.' }),
          text('email', 'Email', { half: true, help: 'Tapping it opens the email app.' }),
          area('address', 'Showroom address', { rows: 2 }),
          text('factoryLocation', 'Factory location', { half: true, help: 'Leave empty to hide it.' }),
          text('hours', 'Consultation hours', { half: true, help: 'Leave empty to hide it.' }),
          text('whatsapp', 'WhatsApp number', { help: 'Digits only with country code, e.g. 919876543210. Contact form messages open on this number.' }),
          text('mapUrl', 'Google Maps link of the showroom', {
            placeholder: 'https://maps.app.goo.gl/…',
            help: "Open the showroom on Google Maps → Share → Copy link, and paste it here (the embed code <iframe …> also works). A map then appears on the Contact page; tapping it opens Google Maps and starts the route on the visitor's phone or PC. Leave empty to hide the map.",
          }),
        ],
      },
    },
    {
      key: 'contact',
      spec: {
        type: 'group',
        fields: [
          {
            type: 'group',
            title: 'Heading & info',
            fields: [
              text('eyebrow', 'Small line above title', { half: true }),
              text('title', 'Page title', { half: true }),
              text('infoTitle', 'Info heading', { half: true }),
              area('infoText', 'Info text', { rows: 2 }),
              text('phoneLabel', 'Label: phone', { half: true }),
              text('emailLabel', 'Label: email', { half: true }),
              text('addressLabel', 'Label: address', { half: true }),
              text('factoryLabel', 'Label: factory', { half: true }),
              text('hoursLabel', 'Label: hours', { half: true }),
              text('mapTitle', 'Map heading', { half: true, help: 'Leave empty for no heading.' }),
              text('mapButton', 'Map button text', { half: true }),
            ],
          },
          {
            type: 'group',
            title: 'Form',
            fields: [
              text('nameLabel', 'Label: name', { half: true }),
              text('phoneFieldLabel', 'Label: phone', { half: true }),
              text('cityLabel', 'Label: city', { half: true }),
              text('categoryLabel', 'Label: interested in', { half: true }),
              text('categoryPlaceholder', 'Dropdown placeholder', { half: true }),
              text('messageLabel', 'Label: message', { half: true }),
              text('buttonLabel', 'Submit button text', { half: true }),
              text('successText', 'Message after sending'),
              { type: 'strings', key: 'categories', label: 'Dropdown options (Interested in)', addLabel: 'Add option' },
            ],
          },
        ],
      },
    },
  ],
};

export const offerPage = {
  title: 'Offer Banner',
  description: 'A festival or offer pop-up shown over the website. Visitors see it first every time they open or refresh the site, until they close it with the X.',
  parts: [
    {
      key: 'offer',
      spec: {
        type: 'group',
        title: 'Offer pop-up',
        fields: [
          { type: 'toggle', key: 'enabled', label: 'Show the offer banner on the website' },
          media('image', 'Banner image', 'any', 'Upload your festival / offer poster. Portrait or square posters look best.'),
          text('title', 'Heading (optional)', { half: true }),
          text('buttonLabel', 'Button text (optional)', { half: true, help: 'Leave empty for no button.' }),
          area('text', 'Text (optional)', { rows: 2 }),
          link('buttonLink', 'Button goes to'),
          { type: 'date', key: 'startDate', label: 'Show from (optional)', half: true, help: 'Leave empty to start immediately.' },
          { type: 'date', key: 'endDate', label: 'Show until (optional)', half: true, help: 'Last day it is shown. Leave empty to keep it until you switch it off.' },
          {
            type: 'select',
            key: 'frequency',
            label: 'How often visitors see it',
            options: [
              { value: 'always', label: 'Every time the website opens or is refreshed' },
              { value: 'session', label: 'Once per visit (until the browser tab is closed)' },
            ],
          },
        ],
      },
    },
  ],
};
