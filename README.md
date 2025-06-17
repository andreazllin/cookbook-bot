# Cookbook | Telegram Bot

Telegram Bot that given a recipe resource returns a well-formatted recipe ready to be included into your personal recipe book.

## Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run `cp .env.example .dev.vars`
4. Fill `.dev.vars`
   - You can get your `BOT_TOKEN` from [@BotFather](https://telegram.me/BotFather)
5. Replace URLS in `scripts/webhook.js`

### Development

1. Run `pnpm run webhook:setup:dev`
   - For this step you need to have `scripts/webhook.js` filled
   - You might need to use something like ngrok or pinggy
2. [For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types): `npm run cf-typegen`
3. `pnpm run dev`

### Deploy

1. Set your secrets
   - `npx wrangler secret put BOT_TOKEN`
   - `npx wrangler secret put WHITELISTED_USER_IDS`
2. `pnpm run deploy`

## Available commands

### `/start`

Starting command, nothing interesting to see

### `/recipe <text>`

By proving some text containing a recipe, the bot will send a `.txt` file containing the recipe formatted in a nice way.

### `/link <url>`

By proving a link containing a recipe, the bot will send a `.txt` file containing the recipe formatted in a nice way.
