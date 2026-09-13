import { Context } from 'koa';
import Router from '@koa/router';

import { validateBody } from '../middlewares/validate';
import WebhookService from '../services/webhook';
import { EmailPayload, EmailValidation } from '../validations/email';

const routerOpts = {
  prefix: '/webhook',
};

const WebhookRouter = new Router(routerOpts);
const webhookService = new WebhookService();

WebhookRouter.post(
  '/process',
  validateBody(EmailValidation),
  async (ctx: Context) => {
    const log = await webhookService.processEmail(
      ctx.request.body as EmailPayload,
    );

    ctx.body = {
      data: log,
    };
  },
);

export default WebhookRouter;
