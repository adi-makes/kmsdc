/** Pages covered by visual QA and accessibility checks. Extend as phases add pages. */
export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'services', path: '/services' },
  { name: 'service-root-canal', path: '/services/root-canal-treatment' },
  { name: 'about', path: '/about' },
  { name: 'doctors', path: '/doctors' },
  { name: 'facilities', path: '/facilities' },
  { name: 'faqs', path: '/faqs' },
  { name: 'contact', path: '/contact' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: 'not-found', path: '/this-page-does-not-exist' },
  { name: 'staff-setup', path: '/app/setup' },
  { name: 'staff-dashboard', path: '/app' },
  { name: 'design-system', path: '/app/design-system' },
] as const;

export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
