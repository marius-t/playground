import { Context } from 'koa';
import Router from '@koa/router';

const routerOpts = {
  prefix: '/candidates',
};

const CandidatesRouter = new Router(routerOpts);

CandidatesRouter.get('/', async (ctx: Context) => {
  //get current cart products - need  product id's from cart (mobile)
  ctx.body = {
    data: 'get cat',
  };
});

CandidatesRouter.post('/', async (ctx: Context) => {
  // add items to cart and prepare for checkout
  ctx.body = {
    data: 'get product id',
  };
});

export default CandidatesRouter;
