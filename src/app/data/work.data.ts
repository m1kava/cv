import { CLIENT_PROJECTS, EXPERIENCE, PROJECTS } from './cv.data';

export type WorkType = 'client' | 'demo';

export interface WorkItem {
  slug: string;
  name: string;
  type: WorkType;
  /** e.g. "Current job", "Client work", "Live demo". */
  status: string;
  role: string;
  summary: string;
  tech: string[];
  /** Ordering hint for "Newest" sort: YYYY-MM of when the work started. */
  since?: string;
  /** Human-readable period, when known. */
  period?: string;
  /** External production site. */
  url?: string;
  domain?: string;
  /** In-app route: the live demo for demos, the case study for client work. */
  route: string;
  /** What I did — only facts, no filler. */
  highlights: string[];
  /** One-paragraph context for the case study, when known. */
  context?: string;
  preview: 'site' | 'odds' | 'board' | 'chart';
  featured: boolean;
}

const crocobetJob = EXPERIENCE.find((job) => job.company === 'Crocobet');

/** Everything shown on /work: real client work first, then the demos built for this site. */
export const WORK: WorkItem[] = [
  ...CLIENT_PROJECTS.map(
    (client): WorkItem => ({
      slug: client.domain.split('.')[0],
      name: client.name,
      type: 'client',
      status: client.status,
      role: client.role,
      summary: client.summary,
      tech: client.stack ?? [],
      url: client.url,
      domain: client.domain,
      route: `/work/${client.domain.split('.')[0]}`,
      // Crocobet's details come straight from the CV; others only state what is known.
      since: client.name === 'Crocobet' ? crocobetJob?.start : undefined,
      period: client.name === 'Crocobet' ? 'Feb 2021 — Present' : undefined,
      highlights:
        client.name === 'Crocobet' && crocobetJob
          ? crocobetJob.highlights
          : [`Built the frontend of ${client.domain} — the interface every visitor uses, live in production.`],
      context: client.name === 'Crocobet' ? crocobetJob?.summary : undefined,
      preview: 'site',
      featured: true,
    }),
  ),
  ...PROJECTS.map(
    (demo): WorkItem => ({
      slug: demo.route.split('/').pop()!,
      name: demo.name,
      type: 'demo',
      status: 'Live demo',
      role: demo.kicker,
      summary: demo.summary,
      tech: ['Angular', 'TypeScript', ...demo.stack],
      since: '2026-10',
      route: demo.route,
      highlights: [],
      preview: demo.preview,
      featured: false,
    }),
  ),
];

/** Every technology used across the work, most common first. */
export const WORK_TECH: string[] = (() => {
  const counts = new Map<string, number>();
  for (const item of WORK) for (const t of item.tech) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
})();
