import type { School } from '@skolo-saka/school-search';

// Fictional schools for the demo and tests. Names, towns and ids are made up; none is a real school.
// Two schools are both called "Sunbird Primary School", in different towns, so the demo can show the
// component hands back the exact one picked.
export const DEMO_SCHOOLS: School[] = [
  { id: 'demo-001', name: 'Sunbird Primary School', level: 'primary', town: 'Riverbend', province: 'Limpopo', verified: true },
  { id: 'demo-002', name: 'Sunbird Primary School', level: 'primary', town: 'Kopjeskloof', province: 'Free State', verified: false },
  { id: 'demo-003', name: 'Baobab Ridge High School', level: 'high', town: 'Riverbend', province: 'Limpopo', verified: true },
  { id: 'demo-004', name: 'Lighthouse Bay Combined School', level: 'combined', town: 'Seawind', province: 'Eastern Cape', verified: false },
  { id: 'demo-005', name: 'Aloe Valley High School', level: 'high', town: null, municipality: 'Greenhill Local Municipality', province: 'KwaZulu-Natal', verified: true },
  { id: 'demo-006', name: 'Morning Star Primary School', level: 'primary', town: 'Kopjeskloof', province: 'Free State', verified: false },
  { id: 'demo-007', name: 'Kingfisher Secondary School', level: 'high', town: 'Mistvale', province: 'Mpumalanga', verified: false },
  { id: 'demo-008', name: 'Thornfield Primary School', level: 'primary', town: 'Seawind', province: 'Eastern Cape', verified: true },
];

/** Matches name, town, municipality or province, like the website's directory search. */
export function matchSchools(query: string, schools: School[] = DEMO_SCHOOLS): School[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return schools.filter(s => {
    const text = [s.name, s.town, s.municipality, s.province].filter(Boolean).join(' ').toLowerCase();
    return words.every(w => text.includes(w));
  });
}
