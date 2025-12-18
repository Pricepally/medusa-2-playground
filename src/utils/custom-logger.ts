import type { Logger } from '@medusajs/framework/types';
import pino from 'pino';
import { getContext } from '@/utils/middlewares/async-context';
import { envConfig } from '@/helpers/env.helpers';

class PinoStdoutLogger implements Logger {
  private p = pino({
    level: envConfig.LOG_LEVEL || 'info',
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    // pull per-request/job context automatically
    mixin() {
      return getContext();
    },
    formatters: { level: (l) => ({ level: l }) },
  });

  panic(data: unknown): void {
    this.p.fatal({ data }, 'PANIC');
  }
  shouldLog(level: string): boolean {
    const order = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    return order.indexOf(level) <= order.indexOf(this.p.level as string);
  }
  setLogLevel(level: string): void {
    this.p.level = level as any;
    this.p.info({ msg: `Set log level: ${level}` });
  }
  unsetLogLevel(): void {
    this.p.level = 'info';
    this.p.info({ msg: 'Unset log level' });
  }

  activity(message: string): string {
    const id = Math.random().toString(36).slice(2);
    this.p.info({ activityId: id, msg: `ACTIVITY: ${message}` });
    return id;
  }
  progress(id: string, message: string): void {
    this.p.info({ activityId: id, msg: `PROGRESS: ${message}` });
  }
  failure(id: string, message: string): unknown {
    this.p.warn({ activityId: id, msg: `FAILURE: ${message}` });
    return null;
  }
  success(id: string, message: string): Record<string, unknown> {
    this.p.info({ activityId: id, msg: `SUCCESS: ${message}` });
    return { activityId: id, message };
  }

  error(messageOrError: string | Error, error?: Error): void {
    if (messageOrError instanceof Error)
      this.p.error({ err: messageOrError }, messageOrError.message);
    else if (error instanceof Error)
      this.p.error({ err: error }, messageOrError);
    else this.p.error({ msg: messageOrError });
  }

  silly(message: string): void {
    this.p.debug({ msg: message });
  }
  debug(message: string): void {
    this.p.debug({ msg: message });
  }
  verbose(message: string): void {
    this.p.info({ msg: message });
  }
  http(message: string): void {
    this.p.info({ msg: `HTTP: ${message}` });
  }
  info(message: string): void {
    this.p.info({ msg: message });
  }
  warn(message: string): void {
    this.p.warn({ msg: message });
  }
  log(...args: unknown[]): void {
    this.p.info({ args });
  }
}

// Export instance for medusa-config
export const logger = new PinoStdoutLogger();
export default logger;
