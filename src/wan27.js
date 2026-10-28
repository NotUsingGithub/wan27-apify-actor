// Official Wan 2.7 API Client for Apify Actor
// Docs: https://wan2-7.io/ | MCP: https://wan2-7.io/mcp/ | CLI: https://wan2-7.io/cli/

export const BASE_URL = 'https://wan2-7.io';
export const URLS = Object.freeze({
  website: 'https://wan2-7.io/',
  mcp: 'https://wan2-7.io/mcp/',
  mcpGuide: 'https://wan2-7.io/mcp/guide/',
  cli: 'https://wan2-7.io/cli/',
  pricing: 'https://wan2-7.io/pricing/',
});
export const IMAGE_MODELS = ['wan2.7-image', 'wan2.7-image-pro'];

export class Wan27Error extends Error {
  constructor(message, kind = 'other', status, code) {
    super(message);
    this.name = 'Wan27Error';
    this.kind = kind; // auth | quota | plan | busy | rejected | failed | timeout | other
    this.status = status;
    this.code = code;
  }
}

export function errorFor(status, body = {}) {
  const msg = String(body.error ?? body.message ?? `HTTP ${status}`);
  const code = typeof body.code === 'string' ? body.code : undefined;
  const kind = status === 401 ? 'auth'
    : status === 402 ? 'quota'
    : status === 403 ? 'plan'
    : status === 409 || status === 429 ? 'busy'
    : code === 'content_blocked' || code === 'safety_rejected' ? 'rejected'
    : 'other';
  return new Wan27Error(msg, kind, status, code);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function request(method, path, body, apiKey, { fetchImpl = fetch, tries = 3, baseUrl = BASE_URL } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const headers = {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
      };
      const init = { method, headers };
      if (body !== undefined && method !== 'GET') {
        headers['content-type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
      const res = await fetchImpl(baseUrl.replace(/\/+$/, '') + path, init);
      let json = {};
      try { json = await res.json(); } catch { /* non-JSON */ }
      return { status: res.status, json };
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await sleep(1000 * (i + 1));
    }
  }
  throw lastErr;
}

export function buildParameters(model, { duration = 5, resolution = '1080p', aspectRatio = '16:9', imageUrl = '' } = {}) {
  const p = {
    resolution: resolution || '1080p',
    aspect_ratio: aspectRatio || '16:9',
  };
  if (!IMAGE_MODELS.includes(model)) {
    p.duration = duration || 5;
  }
  if (imageUrl) {
    p.image_url = imageUrl;
  }
  return p;
}

export async function submit(apiKey, prompt, model, parameters, opts) {
  const payload = { prompt, model, ...parameters };
  const r = await request('POST', '/api/v1/generations', payload, apiKey, opts);
  if (r.status < 200 || r.status >= 300) throw errorFor(r.status, r.json);
  const id = r.json?.id ?? r.json?.request_id ?? r.json?.data?.id;
  if (!id) throw new Wan27Error('Wan 2.7 API returned no task id', 'other', r.status);
  return String(id);
}

export async function waitFor(apiKey, id, timeoutMs, { pollMs = 4000, onTick, ...opts } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    let d;
    try {
      const r = await request('GET', `/api/v1/tasks/${encodeURIComponent(id)}`, undefined, apiKey, opts);
      if (r.status === 401 || r.status === 403) throw errorFor(r.status, r.json);
      if (r.status >= 200 && r.status < 300) d = r.json?.data ?? r.json;
    } catch (e) {
      if (e instanceof Wan27Error) throw e;
    }
    const status = d?.status;
    const url = d?.output_url ?? d?.url ?? d?.videoUrl ?? d?.imageUrl;
    if ((status === 'completed' || status === 'succeeded') && url) return String(url);
    if (status === 'failed' || status === 'error') {
      throw new Wan27Error(`Task ${id} failed (${d?.error ?? 'unknown error'})`, 'failed');
    }
    onTick?.(status);
    if (Date.now() >= deadline) {
      throw new Wan27Error(`Timed out waiting for task ${id}; check https://wan2-7.io/`, 'timeout');
    }
    await sleep(pollMs);
  }
}

export async function credits(apiKey, opts) {
  const r = await request('GET', '/api/v1/account/balance', undefined, apiKey, opts);
  if (r.status >= 200 && r.status < 300) {
    return Number(r.json?.credits ?? r.json?.data?.remainingCredits ?? 0);
  }
  throw errorFor(r.status, r.json);
}
