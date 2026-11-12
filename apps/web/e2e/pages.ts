/** Pages covered by visual QA and accessibility checks. Extend as phases add pages. */
export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'staff-dashboard', path: '/app' },
  { name: 'design-system', path: '/app/design-system' },
] as const;

export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
