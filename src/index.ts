import { parseWhitelist, whitelistMiddleware } from "@/helpers/auth"
import { callWorkerAI, callWorkerAIJson } from "@/helpers/prompts"
import axios from "axios"
import { Bot, InputFile, webhookCallback } from "grammy"
import { Hono } from "hono"
import { parse } from "node-html-parser"
import { ignoredTags } from "./constants/prompts"

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
    if (!ctx.match) {
      return ctx.reply("Please provide a link")
    }

    const loadingMessage = await ctx.reply("Caricando...")

    try {
      const response = await axios.get<string>(ctx.match.trim())
      const root = parse(response.data)
      const bodyNode = root.querySelector("body")
      bodyNode?.children.forEach((node) => {
        // Remove ignored tags
        if (ignoredTags.includes(node.rawTagName)) {
          node.remove()
        }
      })
      const bodyText = bodyNode?.children.map((ch) => ch.textContent.trim()).filter(Boolean).join("")
      if (!bodyText) {
        return await ctx.reply("No valid content found in the provided link.")
      }
      const formattedBodyText = bodyText
        .split('\n').map(line => line.trim()).join('\n')
        .replace(/\n{2,}/g, '\n')
        .replace(/ {2,}/g, ' ');
      const aiResponse = await callWorkerAI(c, formattedBodyText)
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

  bot.command("mela", async (ctx) => {
    if (!ctx.match) {
      return ctx.reply("Please provide a link")
    }

    const loadingMessage = await ctx.reply("Caricando...")

    try {
      const response = await axios.get<string>(ctx.match.trim())
      const root = parse(response.data)
      const bodyNode = root.querySelector("body")
      bodyNode?.children.forEach((node) => {
        if (ignoredTags.includes(node.rawTagName)) {
          node.remove()
        }
      })
      const bodyText = bodyNode?.children.map((ch) => ch.textContent.trim()).filter(Boolean).join("")
      if (!bodyText) {
        return await ctx.reply("No valid content found in the provided link.")
      }
      const images = bodyNode
        ? bodyNode.querySelectorAll("img").map((img) => img.getAttribute("src")).filter(Boolean)
        : []
      const formattedBodyText = bodyText
        .split('\n').map(line => line.trim()).join('\n')
        .replace(/\n{2,}/g, '\n')
        .replace(/ {2,}/g, ' ');
      const prompt = `${formattedBodyText}\n\nImages:\n${images.join("\n")}`;
      const aiResponse = await callWorkerAIJson(c, prompt)
      const file = new InputFile(
        new Blob([JSON.stringify(aiResponse, null, 2)], {
          type: "application/json"
        }),
        "recipe.json"
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
