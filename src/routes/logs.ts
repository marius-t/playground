import { Context } from 'koa';
import Router from '@koa/router';
import { Prisma } from '@prisma/client';

import { validateBody } from '../middlewares/validate';
import LogProvider from '../providers/log';
import { CreateLogValidation, UpdateLogValidation } from '../validations/log';

const routerOpts = {
  prefix: '/logs',
};

const LogRouter = new Router(routerOpts);
const logProvider = new LogProvider();

LogRouter.get('/', async (ctx: Context) => {
  ctx.body = {
    data: await logProvider.getLogs(),
  };
});

LogRouter.get('/:id', async (ctx: Context) => {
  const log = await logProvider.getLog(Number(ctx.params.id));

  if (!log) {
    ctx.status = 404;
    ctx.body = { error: 'Log not found' };
    return;
  }

  ctx.body = {
    data: log,
  };
});

LogRouter.post('/', validateBody(CreateLogValidation), async (ctx: Context) => {
  const data = ctx.request.body as Prisma.LogUncheckedCreateInput;

  ctx.status = 201;
  ctx.body = {
    data: await logProvider.createLog(data),
  };
});

LogRouter.put(
  '/:id',
  validateBody(UpdateLogValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.LogUncheckedUpdateInput;

    ctx.body = {
      data: await logProvider.updateLog(Number(ctx.params.id), data),
    };
  },
);

LogRouter.delete('/:id', async (ctx: Context) => {
  ctx.body = {
    data: await logProvider.deleteLog(Number(ctx.params.id)),
  };
});

export default LogRouter;
