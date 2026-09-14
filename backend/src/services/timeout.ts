export class StepTimeoutError extends Error {
  constructor(public stateAtTimeout: string, ms: number) {
    super(`Step timed out after ${ms}ms while in state ${stateAtTimeout}`);
  }
}

/** Races a step's promise against a deadline; on timeout, throws StepTimeoutError tagging which state it was stuck in. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, stateAtTimeout: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StepTimeoutError(stateAtTimeout, ms)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
