export interface SocialLink {
  label: string;
  handle: string;
  url: string;
  icon: 'linkedin' | 'github' | 'telegram';
}

export interface Experience {
  role: string;
  company: string;
  companyUrl?: string;
  type: string;
  start: string;
  end?: string;
  summary: string;
  highlights: string[];
  stack: string[];
}

export const PROFILE = {
  firstName: 'Vladimer',
  lastName: 'Mikava',
  initials: 'VM',
  title: 'Software Engineer · Angular Developer',
  location: 'Tbilisi, Georgia',
  timeZone: 'Asia/Tbilisi',
  avatar: 'https://avatars.githubusercontent.com/u/39157290?v=4',
  company: { name: 'Crocobet', url: 'https://www.crocobet.com' },
  angularSince: '2021-02',
  careerSince: '2018-03',
  /** Phrases cycled by the typing effect in the hero. */
  taglines: ['Angular apps', 'reactive UIs', 'scalable front-ends', 'pixel-perfect interfaces'],
  about: [
    "I turn ideas into products people actually enjoy using. Since 2021 I've been shipping features to a high-traffic platform where every millisecond and every pixel counts — and where \"it works on my machine\" is never good enough.",
    "I care about the result, not just the code: fast pages, smooth releases, happy users and a team that ships with confidence. Give me a hard problem and a deadline — I'll bring the solution, and probably a few ideas you didn't ask for.",
  ],
};

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', handle: 'in/mikava', url: 'https://www.linkedin.com/in/mikava', icon: 'linkedin' },
  { label: 'GitHub', handle: '@m1kava', url: 'https://github.com/m1kava', icon: 'github' },
  { label: 'Telegram', handle: '@m1kav4', url: 'https://t.me/m1kav4', icon: 'telegram' },
];

export const EXPERIENCE: Experience[] = [
  {
    role: 'Angular Developer',
    company: 'Crocobet',
    companyUrl: 'https://www.crocobet.com',
    type: 'Full-time',
    start: '2021-02',
    summary: 'Building and evolving high-traffic web applications with a focus on performance and a scalable front-end architecture.',
    highlights: [
      'Develop and maintain responsive Angular applications.',
      'Turn designs into polished, performant, user-friendly features.',
      'Integrate REST APIs and design reactive data flows with RxJS & NgRx.',
      'Own release versions and smooth deployments to production.',
      'Mentor junior developers and run code reviews.',
    ],
    stack: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'SCSS', 'GitLab'],
  },
  {
    role: 'Front-End Developer',
    company: 'HobbyStudio',
    type: 'Full-time',
    start: '2018-06',
    end: '2018-12',
    summary: 'Delivered custom web solutions for a range of client projects.',
    highlights: [
      'Built and optimised front-end components with HTML, CSS and JavaScript.',
      'Worked directly with clients to design and develop custom websites.',
    ],
    stack: ['JavaScript', 'HTML5', 'CSS3'],
  },
  {
    role: 'Front-End Web Developer Intern',
    company: 'Ministry of Education and Science of Georgia',
    type: 'Internship',
    start: '2018-03',
    end: '2018-05',
    summary: 'Helped develop educational tools and portals for internal use.',
    highlights: ['Gained hands-on experience with modern web development.'],
    stack: ['JavaScript', 'HTML5', 'CSS3'],
  },
];

export const SKILLS = ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals', 'JavaScript', 'HTML5', 'CSS3', 'SCSS', 'REST APIs', 'Git', 'GitLab', 'Jira'];

export interface ClientProject {
  name: string;
  url: string;
  domain: string;
  role: string;
  /** Short status line, e.g. "Current job". */
  status: string;
  summary: string;
  stack?: string[];
}

/** Real production work, shown as the featured card above the demos. */
export const CLIENT_PROJECTS: ClientProject[] = [
  {
    name: 'Crocobet',
    url: 'https://crocobet.com/',
    domain: 'crocobet.com',
    role: 'Angular Developer · since 2021',
    status: 'Current job',
    summary:
      'I work on the frontend of crocobet.com — a high-traffic betting platform where performance and reliability matter every second. Features, releases, reviews and mentoring.',
    stack: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'SCSS'],
  },
  {
    name: 'Prime Labs',
    url: 'https://primelabs.ge/',
    domain: 'primelabs.ge',
    role: 'Frontend development',
    status: 'Client work',
    summary: 'I built the frontend of the Prime Labs website — the part every visitor sees and uses. It is live in production.',
  },
];

export interface Project {
  name: string;
  route: string;
  kicker: string;
  summary: string;
  stack: string[];
  preview: 'odds' | 'board' | 'chart';
}

/** Demo projects that live on this site (see src/app/work and src/app/kickoff). */
export const PROJECTS: Project[] = [
  {
    name: 'Kickoff Sportsbook',
    route: '/kickoff',
    kicker: 'Flagship · full app',
    summary:
      'A complete football betting app: live matches priced by a Poisson model, match centre with stats & timeline, singles and accumulators, live cash-out, auto-settlement, wallet, login, and English / Georgian.',
    stack: ['Signals', 'RxJS', 'Lazy routes', 'i18n', 'Unit tests'],
    preview: 'odds',
  },
  {
    name: 'Live Odds Board',
    route: '/work/live-odds',
    kicker: 'Real-time',
    summary: 'In-play betting board on a live RxJS feed — flashing prices, goals that swing markets, and a bet slip that catches every odds change.',
    stack: ['Signals', 'RxJS', 'OnPush'],
    preview: 'odds',
  },
  {
    name: 'Signal Task Board',
    route: '/work/task-board',
    kicker: 'State management',
    summary: 'Drag-and-drop Kanban with undo / redo, inline editing, filters, WIP limits and local persistence — all on signals.',
    stack: ['Signals', 'Drag & Drop', 'Undo / Redo'],
    preview: 'board',
  },
  {
    name: 'Live Market Chart',
    route: '/work/market-chart',
    kicker: 'Canvas & performance',
    summary: 'Hand-drawn canvas candlestick chart with a live price stream, zoom, pan, crosshair, timeframes and moving averages.',
    stack: ['Canvas 2D', 'RxJS', 'rAF rendering'],
    preview: 'chart',
  },
];
