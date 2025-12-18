import { AsyncLocalStorage } from 'node:async_hooks';

export type TCtx = Record<string, any>;
const als = new AsyncLocalStorage<TCtx>();

export function runWithContext<T>(ctx: TCtx, fn: () => T) {
  return als.run(ctx, fn);
}
export function getContext(): TCtx {
  return als.getStore() ?? {};
}
export function patchContext(partial: TCtx) {
  const cur = als.getStore();
  if (cur) Object.assign(cur, partial);
}
