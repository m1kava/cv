export interface SocialLink {
  label: string;
  url: string;
  icon: 'linkedin' | 'github' | 'telegram';
}

export interface Experience {
  role: string;
  company: string;
  companyUrl?: string;
  start: string;
  end?: string;
  description: string;
}

export const PROFILE = {
  name: 'Vladimer Mikava',
  firstName: 'Vladimer',
  title: 'Software engineer & Angular developer',
  location: 'Tbilisi, Georgia',
  avatar: 'https://avatars.githubusercontent.com/u/39157290?v=4',
  company: { name: 'Crocobet', url: 'https://www.crocobet.com' },
  angularSince: '2021-02',
};

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mikava', icon: 'linkedin' },
  { label: 'GitHub', url: 'https://github.com/m1kava', icon: 'github' },
  { label: 'Telegram', url: 'https://t.me/m1kav4', icon: 'telegram' },
];

export const EXPERIENCE: Experience[] = [
  {
    role: 'Angular Developer',
    company: 'Crocobet',
    companyUrl: 'https://www.crocobet.com',
    start: '2021-02',
    description:
      'Building and maintaining Angular apps, working closely with designers, integrating APIs, reviewing code, mentoring juniors and shipping releases.',
  },
  {
    role: 'Front-End Developer',
    company: 'HobbyStudio',
    start: '2018-06',
    end: '2018-12',
    description: 'Built custom websites and front-end components for clients with HTML, CSS and JavaScript.',
  },
  {
    role: 'Front-End Intern',
    company: 'Ministry of Education and Science of Georgia',
    start: '2018-03',
    end: '2018-05',
    description: 'Helped develop internal educational tools and portals.',
  },
];

export const SKILLS = ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'JavaScript', 'HTML', 'CSS / SCSS', 'Git', 'GitLab', 'Jira'];
