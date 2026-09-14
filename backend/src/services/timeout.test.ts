import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout, StepTimeoutError } from './timeout';

test('withTimeout resolves normally when the promise finishes in time', async () => {
  const result = await withTimeout(Promise.resolve('ok'), 100, 'some-state');
  assert.equal(result, 'ok');
});

test('withTimeout rejects with StepTimeoutError tagging the state when the deadline passes', async () => {
  const neverResolves = new Promise(() => {});
  await assert.rejects(() => withTimeout(neverResolves, 20, 'CREDENTIAL_ISSUED'), (err: unknown) => {
    assert.ok(err instanceof StepTimeoutError);
    assert.equal((err as StepTimeoutError).stateAtTimeout, 'CREDENTIAL_ISSUED');
    return true;
  });
});
