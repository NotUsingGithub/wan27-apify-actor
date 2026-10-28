# Wan 2.7 AI Video & Image Generator — Apify Actor (`wan27-apify-actor`)

Official Apify Actor for **[Wan 2.7 AI](https://wan2-7.io/)** (`wan2-7.io`). Pass a list of text prompts and your Wan 2.7 API token to generate 1080p/2K AI videos (`wan2.7-t2v`, `wan2.7-i2v`) or studio-grade images (`wan2.7-image`, `wan2.7-image-pro`) and export the hosted output URLs directly to your Apify dataset.

## Official Documentation & Links

- **Wan 2.7 Website & Studio**: [https://wan2-7.io/](https://wan2-7.io/)
- **Wan 2.7 MCP Server**: [https://wan2-7.io/mcp/](https://wan2-7.io/mcp/)
- **Wan 2.7 MCP Setup Guide**: [https://wan2-7.io/mcp/guide/](https://wan2-7.io/mcp/guide/)
- **Wan 2.7 CLI Reference**: [https://wan2-7.io/cli/](https://wan2-7.io/cli/)
- **Wan 2.7 Pricing & Credits**: [https://wan2-7.io/pricing/](https://wan2-7.io/pricing/)

## Input Example

```json
{
  "apiKey": "wan27_your_api_token",
  "prompts": [
    "A neon-lit rain-soaked cybernetic street market in Tokyo at dusk, slow camera dolly push-in",
    "Aerial FPV drone shot sweeping over snow-covered alpine ridges at sunrise"
  ],
  "model": "wan2.7-t2v",
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "duration": 5,
  "timeoutSecs": 600
}
```

## Output Dataset Row

```json
{
  "prompt": "A neon-lit rain-soaked cybernetic street market in Tokyo at dusk, slow camera dolly push-in",
  "model": "wan2.7-t2v",
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "parameters": {
    "resolution": "1080p",
    "aspect_ratio": "16:9",
    "duration": 5
  },
  "id": "task_01j...",
  "url": "https://wan2-7.io/..."
}
```

## Deploying to Apify

In Apify Console → **Actors → Create new → Link Git Repository**, enter `https://github.com/NotUsingGithub/wan27-apify-actor` and click **Build**.

## License

MIT © [Wan27](https://wan2-7.io/)
