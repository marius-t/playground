import { Context } from 'koa';
import Router from '@koa/router';

const routerOpts = {
  prefix: '/webhook',
};

const WebhookRouter = new Router(routerOpts);

WebhookRouter.post('/process', async (ctx: Context) => {
  // add items to cart and prepare for checkout
  ctx.body = {
    data: 'get product id',
  };
});

export default WebhookRouter;
