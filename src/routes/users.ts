import { Context } from 'koa';
import Router from '@koa/router';
import { Prisma } from '@prisma/client';

import { validateBody } from '../middlewares/validate';
import UserProvider from '../providers/user';
import {
  CreateUserValidation,
  UpdateUserValidation,
} from '../validations/user';

const routerOpts = {
  prefix: '/users',
};

const UsersRouter = new Router(routerOpts);
const userProvider = new UserProvider();

UsersRouter.get('/', async (ctx: Context) => {
  ctx.body = {
    data: await userProvider.getUsers(),
  };
});

UsersRouter.get('/:id', async (ctx: Context) => {
  const user = await userProvider.getUser(Number(ctx.params.id));

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }

  ctx.body = {
    data: user,
  };
});

UsersRouter.post(
  '/',
  validateBody(CreateUserValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.UserUncheckedCreateInput;

    ctx.status = 201;
    ctx.body = {
      data: await userProvider.createUser(data),
    };
  },
);

UsersRouter.put(
  '/:id',
  validateBody(UpdateUserValidation),
  async (ctx: Context) => {
    const data = ctx.request.body as Prisma.UserUncheckedUpdateInput;

    ctx.body = {
      data: await userProvider.updateUser(Number(ctx.params.id), data),
    };
  },
);

UsersRouter.delete('/:id', async (ctx: Context) => {
  ctx.body = {
    data: await userProvider.deleteUser(Number(ctx.params.id)),
  };
});

export default UsersRouter;
