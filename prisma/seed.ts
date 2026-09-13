import {
  Candidate,
  CandidateStatus,
  Job,
  PrismaClient,
  User,
} from '@prisma/client';

import 'dotenv/config';

const prisma = new PrismaClient();

const USERS = [
  { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
  { name: 'Brian Carter', email: 'brian.carter@example.com' },
  { name: 'Chloe Nguyen', email: 'chloe.nguyen@example.com' },
  { name: 'Daniel Okafor', email: 'daniel.okafor@example.com' },
  { name: 'Emma Larsson', email: 'emma.larsson@example.com' },
  { name: 'Farid Haddad', email: 'farid.haddad@example.com' },
  { name: 'Grace Kimani', email: 'grace.kimani@example.com' },
  { name: 'Hugo Martins', email: 'hugo.martins@example.com' },
  { name: 'Iris Dmitrieva', email: 'iris.dmitrieva@example.com' },
  { name: 'Jonas Weber', email: 'jonas.weber@example.com' },
];

const JOBS = [
  {
    title: 'Senior Backend Engineer',
    description: 'Build and own our Koa/Prisma services.',
  },
  {
    title: 'Frontend Engineer (React)',
    description: 'Ship the customer-facing web app.',
  },
  {
    title: 'Data Engineer',
    description: 'Design our ingestion and warehouse pipelines.',
  },
  {
    title: 'DevOps Engineer',
    description: 'Own CI/CD, Docker and observability.',
  },
  {
    title: 'Product Designer',
    description: 'End-to-end UX for the hiring platform.',
  },
  { title: 'QA Engineer', description: 'Automated and exploratory testing.' },
  {
    title: 'Technical Recruiter',
    description: 'Source and screen engineering talent.',
  },
  { title: 'Engineering Manager', description: 'Lead a squad of 6 engineers.' },
  {
    title: 'Security Engineer',
    description: 'AppSec reviews and threat modelling.',
  },
  {
    title: 'Customer Success Manager',
    description: 'Onboard and retain key accounts.',
  },
];

const CANDIDATE_NAMES = [
  'Marta Silva',
  'Noah Bennett',
  'Olivia Rossi',
  'Peter Novak',
  'Quinn Alvarez',
  'Rania Youssef',
  'Samuel Adeyemi',
  'Tara Williams',
  'Umar Farouk',
  'Vera Petrova',
  'William Chen',
  'Xenia Ivanova',
];

const CANDIDATE_STATUSES = Object.values(CandidateStatus);

async function main(): Promise<void> {
  // Reset (children before parents) so re-running is deterministic.
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const users: User[] = [];
  for (const user of USERS) {
    users.push(await prisma.user.create({ data: user }));
  }

  const jobs: Job[] = [];
  for (let i = 0; i < JOBS.length; i += 1) {
    const owner = users[i % users.length];
    jobs.push(
      await prisma.job.create({ data: { ...JOBS[i], user_id: owner.id } }),
    );
  }

  const candidates: Candidate[] = [];
  for (let i = 0; i < CANDIDATE_NAMES.length; i += 1) {
    const name = CANDIDATE_NAMES[i];
    candidates.push(
      await prisma.candidate.create({
        data: {
          name,
          email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
          job_id: jobs[i % jobs.length].id,
          status: CANDIDATE_STATUSES[i % CANDIDATE_STATUSES.length],
        },
      }),
    );
  }

  console.log(
    `Seeded ${users.length} users, ${jobs.length} jobs, ${candidates.length} candidates.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
