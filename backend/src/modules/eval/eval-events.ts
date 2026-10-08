import { Injectable, Logger } from '@nestjs/common';
export type EvalEvent = {
  type: 'artifact_versioned' | 'eval_recorded';
  artifactId: string;
  version: string;
  predecessorId?: string;
};
/** Instrumentation hooks only. No experiment allocation or learner payloads. Listener failures never break writes. */
@Injectable()
export class EvalEvents {
  private readonly logger = new Logger(EvalEvents.name);
  private readonly listeners = new Set<(event: EvalEvent) => void>();
  subscribe(listener: (event: EvalEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event: EvalEvent) {
    this.logger.debug(JSON.stringify({ event: event.type, ...event }));
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        this.logger.warn('Eval instrumentation listener failed');
      }
    }
  }
}
