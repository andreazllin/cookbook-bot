import { parseWhitelist, whitelistMiddleware } from "@/helpers/auth"
import { callWorkerAI } from "@/helpers/prompts"
import axios from "axios"
import { Bot, InputFile, webhookCallback } from "grammy"
import { Hono } from "hono"

const app = new Hono<{ Bindings: Cloudflare.Env }>()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.post("/webhook", async (c) => {
  const bot = new Bot(c.env.BOT_TOKEN)

  bot.use(whitelistMiddleware(parseWhitelist(c.env.WHITELISTED_USER_IDS)))

  bot.command("start", (ctx) => {
    return ctx.reply("Welcome to the bot!")
  })

  bot.command("recipe", async (ctx) => {
    if (!ctx.match) {
      return ctx.reply("Please provide a recipe")
    }

    const prompt = ctx.match.trim()
    try {
      const aiResponse = await callWorkerAI(c, prompt)
      const file = new InputFile(
        new Blob([aiResponse], { type: "text/plain" }),
        "recipe.txt"
      )
      await ctx.replyWithDocument(file)
    } catch (error) {
      console.error(error)
      return await ctx.reply(
        "Error processing your request. Please try again later."
      )
    }
  })

  bot.command("link", async (ctx) => {
    const loadingMessage = await ctx.reply("Caricando...")

    if (!ctx.match) {
      return ctx.reply("Please provide a link")
    }

    try {
      const response = await axios.get<string>(ctx.match.trim())
      const aiResponse = await callWorkerAI(c, response.data)
      const file = new InputFile(
        new Blob([aiResponse], { type: "text/plain" }),
        "recipe.txt"
      )
      await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id)
      await ctx.replyWithDocument(file)
    } catch (error) {
      console.error(error)
      return await ctx.reply(
        "Error processing your request. Please try again later."
      )
    }
  })

  const handler = webhookCallback(bot, "hono", {
    timeoutMilliseconds: 1000 * 60 * 5
  })
  return await handler(c)
})

export default app
