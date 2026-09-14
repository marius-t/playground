# TalSource - Sourcing project

A small utility for treating incoming webook messages from `Microsoft Graph` API via webhooks.

How it works:
- an email is received by Microsoft Office Exchange Server, once that email is received a webhook message is fired
- when the API will receive a request from the webhook it will parse the payload 
- messages are used as triggers for inside business logic

# Before getting started

1. Make sure you have nvm (Node Version Manager) installed, more info [here](https://www.nvmnode.com/)
2. **Not required for development.** Make sure you have installed globally `pm2`, [more info](https://pm2.io/docs/runtime/guide/installation/)
3. Create an account with [OpenRouter](https://openrouter.ai/) - Generate an API Key and use that inside `.env`
4. **For Local development** Docker desktop is required, more info [here](https://docs.docker.com/engine/install/)

## Get started

1. Copy `.env.exmaple` in `.env` - `cp .env.example .env`
2. Modify `.env` with the required information
3. Run `yarn install`
4. Run `docker compose up -d`
5. To start in development mode use: `yarn start:dev` 
6. Starting the project in production mode is done via PM2 - make sure you have it installed it as a global dependency
  - `npm install pm2 --global`
  - run `pm2` inside the current folder - This will make sure the process will be started in case of machine restart - 
  - `pm2 save all` - is needed to save the processes to plist
7. Seed the database with sample data (users, jobs and candidates) — `yarn prisma:seed`
8. This project usses seem.io for webhook forwarding for local development, to start the script for webhook FW run `yarn start:webhook`

## Database (local dev)

MariaDB runs in Docker (`docker compose up -d`, container `playground-database`) and is exposed on
host port **8888** (database `playground`). The connection string is read from `.env` (`DATABASE_URL`).

| Command | What it does |
|---|---|
| `yarn prisma:seed` | Applies pending migrations, then resets and seeds sample data |
| `yarn prisma:migrate` | Applies pending migrations only |
| `yarn prisma studio` | Browse the data in the browser |

`yarn prisma:seed` is safe to run at any point, including against a brand-new database: it applies
the migrations first, then resets `Log`, `Candidate`, `Job` and `User` and recreates 10 users,
10 jobs and 12 candidates. 

