import { Actor, log } from 'apify';
import { submit, waitFor, buildParameters, Wan27Error, URLS } from './wan27.js';

await Actor.init();

const {
  apiKey = '',
  prompts = [],
  model = 'wan2.7-t2v',
  duration = 5,
  resolution = '1080p',
  aspectRatio = '16:9',
  imageUrl = '',
  timeoutSecs = 600,
} = (await Actor.getInput()) ?? {};

if (!apiKey.trim()) {
  await Actor.fail(`Add your Wan 2.7 API token (obtain one at ${URLS.mcpGuide}).`);
}
if (!Array.isArray(prompts) || prompts.length === 0) {
  await Actor.fail('Provide at least one prompt in the prompts array.');
}

const parameters = buildParameters(model, { duration, resolution, aspectRatio, imageUrl });

for (const prompt of prompts) {
  const row = { prompt, model, resolution, aspectRatio, parameters, id: null, url: null };
  try {
    row.id = await submit(apiKey.trim(), prompt, model, parameters);
    log.info(`Submitted "${prompt.slice(0, 60)}" -> ${row.id}`);
    row.url = await waitFor(apiKey.trim(), row.id, timeoutSecs * 1000, {
      onTick: (s) => log.debug(`${row.id}: ${s ?? 'polling'}`),
    });
    log.info(`Completed: ${row.url}`);
  } catch (err) {
    row.error = err.message;
    row.errorKind = err instanceof Wan27Error ? err.kind : 'other';
    log.warning(`"${prompt.slice(0, 60)}" -> ${row.errorKind}: ${err.message}`);
    if (row.errorKind === 'auth' || row.errorKind === 'quota') {
      await Actor.pushData(row);
      for (const rest of prompts.slice(prompts.indexOf(prompt) + 1)) {
        await Actor.pushData({
          prompt: rest,
          model,
          resolution,
          aspectRatio,
          parameters,
          id: null,
          url: null,
          error: `skipped after ${row.errorKind}: ${err.message}`,
          errorKind: row.errorKind,
        });
      }
      break;
    }
  }
  if (!row.error || (row.errorKind !== 'auth' && row.errorKind !== 'quota')) {
    await Actor.pushData(row);
  }
}

await Actor.exit();
