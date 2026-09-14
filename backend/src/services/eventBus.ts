import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export type FlowUpdate = { type: 'status' | 'event'; flowId: string; data: any };

export function publish(flowId: string, update: FlowUpdate) {
  emitter.emit(flowId, update);
}

export function subscribe(flowId: string, onUpdate: (update: FlowUpdate) => void): () => void {
  emitter.on(flowId, onUpdate);
  return () => emitter.off(flowId, onUpdate);
}
