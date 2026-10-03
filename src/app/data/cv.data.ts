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
  location: string;
  summary: string;
  highlights: string[];
  stack: string[];
}

export interface SkillGroup {
  title: string;
  description: string;
  skills: string[];
}

export const PROFILE = {
  firstName: 'Vladimer',
  lastName: 'Mikava',
  initials: 'VM',
  role: 'Software Engineer',
  specialty: 'Angular & Front-End',
  location: 'Tbilisi, Georgia',
  avatar: 'https://avatars.githubusercontent.com/u/39157290?v=4',
  available: true,
  headline: 'I build fast, scalable and maintainable web applications with Angular and TypeScript.',
  about: [
    'Software engineer specialising in the Angular ecosystem, with 5+ years of building and shipping high-traffic production applications at Crocobet.',
    'I care about clean architecture, reactive state management with RxJS and NgRx, and interfaces that feel effortless to use. Beyond writing code, I review pull requests, mentor junior developers and own the release process to production.',
  ],
  angularSince: '2021-02',
  careerSince: '2018-03',
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
    location: 'Tbilisi, Georgia',
    summary:
      'Building and evolving a high-traffic consumer platform with a strong focus on performance, reliability and a scalable front-end architecture.',
    highlights: [
      'Develop and maintain responsive Angular applications used by a large audience.',
      'Partner with designers to turn product concepts into polished, performant UI.',
      'Integrate REST APIs and design predictable reactive data flows with RxJS and NgRx.',
      'Own release versioning and smooth deployments to production environments.',
      'Mentor junior developers and drive code quality through thorough code reviews.',
    ],
    stack: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'SCSS', 'GitLab'],
  },
  {
    role: 'Front-End Developer',
    company: 'HobbyStudio',
    type: 'Full-time',
    start: '2018-06',
    end: '2018-12',
    location: 'Tbilisi, Georgia',
    summary: 'Delivered custom web solutions for a range of client projects.',
    highlights: [
      'Built and optimised reusable front-end components with HTML, CSS and JavaScript.',
      'Worked directly with clients to translate business requirements into responsive interfaces.',
    ],
    stack: ['JavaScript', 'HTML5', 'CSS3'],
  },
  {
    role: 'Front-End Web Developer Intern',
    company: 'Ministry of Education and Science of Georgia',
    type: 'Internship',
    start: '2018-03',
    end: '2018-05',
    location: 'Tbilisi, Georgia',
    summary: 'Contributed to educational tools and portals for internal use.',
    highlights: [
      'Assisted in developing internal web tools and portals.',
      'Gained hands-on experience with modern web development practices.',
    ],
    stack: ['JavaScript', 'HTML5', 'CSS3'],
  },
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    title: 'Core',
    description: 'Day-to-day framework and language',
    skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals', 'Standalone APIs'],
  },
  {
    title: 'Web platform',
    description: 'Building blocks of every interface',
    skills: ['JavaScript', 'HTML5', 'CSS3', 'SCSS', 'Responsive design'],
  },
  {
    title: 'Engineering',
    description: 'How the work gets shipped',
    skills: ['REST APIs', 'Performance optimisation', 'Code review', 'Release management', 'Mentoring'],
  },
  {
    title: 'Tooling',
    description: 'Workflow and collaboration',
    skills: ['Git', 'GitLab', 'Angular CLI', 'npm', 'Jira'],
  },
];
