# AGENTS.md

Guidance for agents/contributors working in the **talsource** repo.

## What this is

A Koa (v3) + TypeScript HTTP service. It exposes a small REST surface
(`/users`, `/jobs`, `/candidates`, `/webhook`) backed by **MariaDB via Prisma**.
The webhook route forwards external events (via smee.io) during local dev.

Layers:

```
HTTP (Koa)  ->  routes/       HTTP concerns + zod validation
            ->  providers/    DB access (the only place that talks to Prisma)
            ->  prisma.ts     single shared PrismaClient
```

Keep that separation: routes never call `prisma` directly, providers never
touch `ctx`.

## Hard rules

1. **Never use `any`.** Use `unknown` and narrow it (type guards, `satisfies`,
   zod parsing, or a checked cast). This is enforced: `yarn lint` fails on
   `@typescript-eslint/no-explicit-any` (severity `error`). There is no autofix.
   - Bad:  `const data = ctx.request.body as any;`
   - Bad:  `public async createJob(data: any)`
   - Good: `'@typescript-eslint/no-explicit-any': 'error'` stays green because
     you use Prisma input types + zod-inferred types (see templates below).
2. **All DB access goes through a provider**, never inline `prisma.x.y()` in a route.
3. **All request bodies are validated with zod** from `src/validations/`
   before reaching a provider, via the `validateBody` middleware.
4. **Never construct `new PrismaClient()` outside `src/prisma.ts`.** Multiple
   clients = multiple connection pools = outages.
5. **Use a branch + PR** for changes to the default branch (`master`); don't
   commit directly to it.

## Commands

```bash
yarn install              # Yarn 4 (node-modules linker, NOT PnP)
yarn start:dev            # nodemon dev server (reads PORT from .env -> 6000)
yarn build                # tsc -> dist/
yarn lint                 # eslint src  (flat config: eslint.config.js)
yarn lint --fix           # autofix formatting + import order

# Database (MariaDB in docker, host port 8888)
docker compose up -d
yarn prisma migrate dev --name <change>   # create + apply a migration
yarn prisma generate                      # regenerate the client
yarn prisma studio                        # browse data
```

Always finish a change with `yarn build && yarn lint` (both must pass).
Node is pinned to `22.18.0` via `.nvmrc`.

## Templates

### Shared Prisma client (`src/prisma.ts`) — do not add more

```ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

### Provider (`src/providers/<model>.ts`) — typed, no `any`

Use Prisma's generated model types for return values and its **Unchecked**
input types for writes (they accept the scalar FK like `job_id` directly).

```ts
import { Candidate, Prisma } from '@prisma/client';

import { prisma } from '../prisma';

export default class CandidateProvider {
  public async getCandidates(): Promise<Candidate[]> {
    return prisma.candidate.findMany();
  }

  public async getCandidate(id: number): Promise<Candidate | null> {
    return prisma.candidate.findUnique({ where: { id } });
  }

  public async createCandidate(
    data: Prisma.CandidateUncheckedCreateInput,
  ): Promise<Candidate> {
    return prisma.candidate.create({ data });
  }

  public async updateCandidate(
    id: number,
    data: Prisma.CandidateUncheckedUpdateInput,
  ): Promise<Candidate> {
    return prisma.candidate.update({ where: { id }, data });
  }

  public async deleteCandidate(id: number): Promise<Candidate> {
    return prisma.candidate.delete({ where: { id } });
  }
}
```

### Validation (`src/validations/<model>.ts`) — zod

Create and Update schemas live side by side; Update is always a `.partial()` of
Create. Enums mirror the Prisma enum exactly.

```ts
import { z } from 'zod';

export const CandidateStatusValidation = z.enum([
  'NEW',
  'PENDING_INTERNAL_REVIEW',
  // ...keep in sync with the CandidateStatus enum in prisma/schema.prisma
]);

export const CreateCandidateValidation = z.object({
  job_id: z.number().int().positive().optional(),
  name: z.string().min(5),
  email: z.email(),
  status: CandidateStatusValidation.optional(),
});

export const UpdateCandidateValidation = CreateCandidateValidation.partial();
```

### Validation middleware (`src/middlewares/validate.ts`)

```ts
import { Context, Next } from 'koa';
import { ZodType } from 'zod';

export const validateBody =
  (schema: ZodType) =>
  async (ctx: Context, next: Next): Promise<void> => {
    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.status = 400;
      ctx.body = {
        error: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
      return;
    }
    ctx.request.body = result.data;
    await next();
  };
```

### Route (`src/routes/<resource>.ts`)

One provider instance per module (module bodies run once — this is a correct
singleton, not a leak). `ctx.request.body` is typed `unknown`, so after
`validateBody` narrow it to the matching Prisma input type.

```ts
import Router from '@koa/router';
import { Prisma } from '@prisma/client';
import { Context } from 'koa';

import { validateBody } from '../middlewares/validate';
import CandidateProvider from '../providers/candidate';
import {
  CreateCandidateValidation,
  UpdateCandidateValidation,
} from '../validations/candidate';

const CandidatesRouter = new Router({ prefix: '/candidates' });
const candidateProvider = new CandidateProvider();

CandidatesRouter.get('/:id', async (ctx: Context) => {
  const candidate = await candidateProvider.getCandidate(Number(ctx.params.id));
  if (!candidate) {
    ctx.status = 404;
    ctx.body = { error: 'Candidate not found' };
    return;
  }
  ctx.body = { data: candidate };
});

CandidatesRouter.post(
  '/',
  validateBody(CreateCandidateValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.CandidateUncheckedCreateInput;
    ctx.status = 201;
    ctx.body = { data: await candidateProvider.createCandidate(data) };
  },
);

export default CandidatesRouter;
```

Register the router in `src/routes/index.ts` **and** mount it in `src/index.ts`.

## Data model (`prisma/schema.prisma`)

- `User`   id, name, email, created, modified
- `Job`    id, user_id (FK -> User), title, description, created, modified
- `Candidate` id, job_id (nullable FK -> Job), name, email, status, created, modified
- `CandidateStatus` enum, default `NEW` (11 values: NEW, PENDING_INTERNAL_REVIEW,
  REJECTED_INTERNAL, PENDING_EMPLOYER_REVIEW, ACCEPTED_FOR_INTERVIEW,
  REJECTED_FOR_INTERVIEW, OFFER_MADE, OFFER_DECLINED, ACCEPTED_EMPLOYER,
  REJECTED_EMPLOYER, CANDIDATE_WITHDREW)

Conventions: `id` = autoincrement int PK; `created` = `@default(now())`;
`modified` = `@updatedAt`. Table names match the model names (no `@@map`).

To add a table: edit the schema, then `yarn prisma migrate dev --name <change>`,
then build the provider/validation/route trio.

## Environment

- MariaDB runs via `docker compose up -d` (container `playground-database`,
  host port **8888**, db `playground`). `DATABASE_URL` in `.env`.
- `PORT=6000` in `.env`. Note: port 6000 is X11 — Node's `fetch`/undici refuses
  it (`bad port`) and so must `curl` or Node's `http` module in scripts/tests.
- Prisma loads `.env` at runtime via its own import chain; `src/config/index.ts`
  also does `import 'dotenv/config'`.

## Pitfalls (learned the hard way — don't repeat)

- **Prisma must stay on 6.x.** The registry `latest` is Prisma **8** ("Prisma
  Next"), whose only targets are `postgres` and `mongodb` — it *cannot* talk to
  MariaDB (`prisma orm init --target mysql` -> `not one of: postgres, mongodb`).
  This repo pins `prisma`/`@prisma/client` at `6.19.3`. Ignore the "update
  available 6.19.3 -> 8.x" nag unless the DB moves to Postgres.
- **TypeScript must stay on 5.x.** `typescript@latest` is 7.x (the native build);
  it breaks tooling here (peer ranges, editor SDK patching). Keep `^5.7.3`.
- **Don't re-add `@types/koa__router`.** `@koa/router` v15 ships its own types;
  the `@types/*` package is an empty stub and causes `TS2688`.
- **ESLint 10 = flat config only.** The config lives in `eslint.config.js`.
  `eslintrc.js` (legacy, and it's untracked) is ignored; `.eslintignore` is not
  supported. Put ignores in the flat config's `ignores`.
- **Yarn 4 with `nodeLinker: node-modules`** (`.yarnrc.yml`). PnP is deliberately
  off. Re-enabling PnP means no `node_modules` and you must run
  `yarn dlx @yarnpkg/sdks vscode` for the editor to resolve modules.
- **`ctx.request.body` is `unknown`**, not `any` — you must narrow it (the
  `validateBody` + `as Prisma.XInput` pattern above) or `tsc` fails.
- **Port 6000 is blocked by undici** for `fetch()` — see Environment above.

## Verification workflow

1. `yarn build` — must exit 0 (tsc, strict).
2. `yarn lint` — must exit 0 (0 errors; `no-console` is a warning by design).
3. For anything touching the DB, exercise it live. Example smoke test using
   Node's `http` (not `fetch`, port 6000 is blocked):

   ```js
   import http from 'node:http';
   // POST /users { name, email } -> 201, then GET /users -> 200
   // invalid body -> 400 { error: 'Validation failed', issues: [...] }
   // missing id -> 404, bad enum -> 400
   ```

   Truncate the test rows afterwards so the dev DB stays clean.

## Suggested improvements (not yet done)

- **Global error handler.** `app.use(ErrorHandler.catchError)` in `src/index.ts`
  is commented out. Add one that maps Prisma errors to HTTP: `P2025` -> 404,
  `P2002` -> 409, `P2003` -> 400. Right now `PUT`/`DELETE` on a missing id
  throws `P2025` and surfaces as a 500.
- **Declare `dotenv`** explicitly in `dependencies` — it's imported by
  `src/config/index.ts` but only resolves today because Prisma hoists it
  (phantom dependency).
- **Remove the bogus `"tsc": "^2.0.4"` devDependency** — that's npm's `tsc`
  wrapper, not TypeScript. The `build` script's `tsc` correctly resolves to
  the real compiler.
- **Uniqueness:** consider `@unique` on `User.email` (and maybe
  `Candidate.email`), plus an index on `Candidate.job_id` if you filter by job.
- **Pagination** on the list endpoints (`GET /users|/jobs|/candidates`).
- **Tests:** no runner is installed and there are no tests. Jest + supertest
  would fit the Koa/Zod setup.
- **Align `eslint@10`** with plugins that still declare `^9` (YN0060 warning);
  move to plugin majors that support 10, or drop to eslint 9.
- **`DATABASE_URL` pool tuning** under load, e.g. `?connection_limit=5`.

## Git

Remote: `git@github.com:marius-t/playground.git`; default branch `master`.
Put changes on a branch and open a PR rather than committing to `master`.
`src/` is the only code root (`tsconfig` `rootDir`); everything compiles to `dist/`.
