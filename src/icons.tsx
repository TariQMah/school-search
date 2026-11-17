import type { SVGProps } from 'react';

// Search, X and BadgeCheck from Lucide (https://lucide.dev, ISC licence), inlined so the package has
// no icon dependency. They match the lucide-react icons the website used.
const base = { xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const SearchIcon = (props: SVGProps<SVGSVGElement>) =>
  <svg {...base} {...props}><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>;

export const XIcon = (props: SVGProps<SVGSVGElement>) =>
  <svg {...base} {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;

export const BadgeCheckIcon = (props: SVGProps<SVGSVGElement>) =>
  <svg {...base} {...props}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></svg>;
