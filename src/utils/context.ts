import { AsyncLocalStorage } from 'node:async_hooks';

type TRequestContext = {
  customer_id?: string;
  user_id?: string;
  trace_id?: string;
  workflow?: string;
  step?: string;
};

const als = new AsyncLocalStorage<TRequestContext>();

export const Context = {
  run: (ctx: TRequestContext, fn: () => void) => als.run(ctx, fn),
  set: (key: keyof TRequestContext, value: string) => {
    const store = als.getStore();
    if (store) store[key] = value;
  },
  get: () => als.getStore() || {},
};
