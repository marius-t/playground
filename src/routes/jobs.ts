import { Context } from 'koa';
import Router from '@koa/router';
import { Prisma } from '@prisma/client';

import { validateBody } from '../middlewares/validate';
import JobProvider from '../providers/job';
import { CreateJobValidation, UpdateJobValidation } from '../validations/job';

const routerOpts = {
  prefix: '/jobs',
};

const JobRouter = new Router(routerOpts);
const jobProvider = new JobProvider();

JobRouter.get('/', async (ctx: Context) => {
  ctx.body = {
    data: await jobProvider.getJobs(),
  };
});

JobRouter.get('/:id', async (ctx: Context) => {
  const job = await jobProvider.getJob(Number(ctx.params.id));

  if (!job) {
    ctx.status = 404;
    ctx.body = { error: 'Job not found' };
    return;
  }

  ctx.body = {
    data: job,
  };
});

JobRouter.post('/', validateBody(CreateJobValidation), async (ctx: Context) => {
  const data = ctx.request.body as Prisma.JobUncheckedCreateInput;

  ctx.status = 201;
  ctx.body = {
    data: await jobProvider.createJob(data),
  };
});

JobRouter.put(
  '/:id',
  validateBody(UpdateJobValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.JobUncheckedUpdateInput;

    ctx.body = {
      data: await jobProvider.updateJob(Number(ctx.params.id), data),
    };
  },
);

JobRouter.delete('/:id', async (ctx: Context) => {
  ctx.body = {
    data: await jobProvider.deleteJob(Number(ctx.params.id)),
  };
});

export default JobRouter;
