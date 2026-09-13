import Koa, { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import {
  CandidatesRouter,
  JobRouter,
  LogRouter,
  UsersRouter,
  WebhookRouter,
} from './routes';

const app = new Koa();

app.use(
  cors({
    allowHeaders: '*',
    origin: '*',
  }),
);
app.use(bodyParser());
app.use(async (ctx: Context, next) => {
  if (ctx.request.url === '/healthcheck') {
    ctx.body = 'done';
    ctx.status = 200;
    return;
  }
  await next();
});

/**
 * Routes
 */
// app.use(ErrorHandler.catchError);

app.use(UsersRouter.routes());
app.use(CandidatesRouter.routes());
app.use(JobRouter.routes());
app.use(LogRouter.routes());
app.use(WebhookRouter.routes());

const PORT = process.env.PORT || 4000;

console.log(`App started on port: ${PORT}`);

app.listen(PORT);
