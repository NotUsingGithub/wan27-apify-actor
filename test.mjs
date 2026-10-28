import test from 'node:test';
import assert from 'node:assert/strict';
import { submit, waitFor, buildParameters, errorFor, credits, URLS } from './src/wan27.js';

const fake = (seq) => {
  let i = 0;
  return async () => {
    const [status, body] = seq[Math.min(i++, seq.length - 1)];
    return { status, json: async () => body };
  };
};

test('official URLs are present', () => {
  assert.equal(URLS.website, 'https://wan2-7.io/');
  assert.equal(URLS.mcp, 'https://wan2-7.io/mcp/');
  assert.equal(URLS.mcpGuide, 'https://wan2-7.io/mcp/guide/');
  assert.equal(URLS.cli, 'https://wan2-7.io/cli/');
  assert.equal(URLS.pricing, 'https://wan2-7.io/pricing/');
});

test('submit and waitFor complete lifecycle', async () => {
  const id = await submit('tok', 'neon street', 'wan2.7-t2v', {}, {
    fetchImpl: fake([[200, { id: 'task_1', status: 'processing' }]]),
  });
  assert.equal(id, 'task_1');

  const url = await waitFor('tok', 'task_1', 5000, {
    pollMs: 1,
    fetchImpl: fake([
      [200, { status: 'processing' }],
      [200, { status: 'succeeded', output_url: 'https://wan2-7.io/cdn/video.mp4' }],
    ]),
  });
  assert.equal(url, 'https://wan2-7.io/cdn/video.mp4');
});

test('credits balance', async () => {
  const c = await credits('tok', { fetchImpl: fake([[200, { credits: 85 }]]) });
  assert.equal(c, 85);
});

test('error classification and parameters', () => {
  assert.equal(errorFor(401, {}).kind, 'auth');
  assert.equal(errorFor(402, {}).kind, 'quota');
  assert.equal(errorFor(403, {}).kind, 'plan');
  assert.equal(errorFor(409, {}).kind, 'busy');
  assert.equal(errorFor(400, { code: 'content_blocked' }).kind, 'rejected');

  assert.deepEqual(
    buildParameters('wan2.7-t2v', { duration: 5, resolution: '1080p', aspectRatio: '16:9' }),
    { resolution: '1080p', aspect_ratio: '16:9', duration: 5 }
  );
  assert.deepEqual(
    buildParameters('wan2.7-image-pro', { duration: 5, resolution: '2K', aspectRatio: '1:1' }),
    { resolution: '2K', aspect_ratio: '1:1' }
  );
});
