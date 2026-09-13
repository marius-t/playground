import { Context } from 'koa';
import Router from '@koa/router';
import { Prisma } from '@prisma/client';

import { validateBody } from '../middlewares/validate';
import CandidateProvider from '../providers/candidate';
import {
  CreateCandidateValidation,
  UpdateCandidateValidation,
} from '../validations/candidate';

const routerOpts = {
  prefix: '/candidates',
};

const CandidatesRouter = new Router(routerOpts);
const candidateProvider = new CandidateProvider();

CandidatesRouter.get('/', async (ctx: Context) => {
  ctx.body = {
    data: await candidateProvider.getCandidates(),
  };
});

CandidatesRouter.get('/:id', async (ctx: Context) => {
  const candidate = await candidateProvider.getCandidate(Number(ctx.params.id));

  if (!candidate) {
    ctx.status = 404;
    ctx.body = { error: 'Candidate not found' };
    return;
  }

  ctx.body = {
    data: candidate,
  };
});

CandidatesRouter.post(
  '/',
  validateBody(CreateCandidateValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.CandidateUncheckedCreateInput;

    ctx.status = 201;
    ctx.body = {
      data: await candidateProvider.createCandidate(data),
    };
  },
);

CandidatesRouter.put(
  '/:id',
  validateBody(UpdateCandidateValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.CandidateUncheckedUpdateInput;

    ctx.body = {
      data: await candidateProvider.updateCandidate(
        Number(ctx.params.id),
        data,
      ),
    };
  },
);

CandidatesRouter.delete('/:id', async (ctx: Context) => {
  ctx.body = {
    data: await candidateProvider.deleteCandidate(Number(ctx.params.id)),
  };
});

export default CandidatesRouter;
