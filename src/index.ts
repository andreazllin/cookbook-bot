import type { Env } from "@/types"
import { Bot, webhookCallback } from "grammy"
import { Hono } from "hono"

const app = new Hono<{ Bindings: Env }>()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.post("/webhook", async (c) => {
  const bot = new Bot(c.env.BOT_TOKEN)

  bot.command("start", (ctx) => {
    return ctx.reply("Welcome to the bot!")
  })

  const handler = webhookCallback(bot, "hono")
  return await handler(c)
})

export default app
