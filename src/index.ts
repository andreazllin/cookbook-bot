import type { Env } from "@/types";
import { Bot, webhookCallback } from "grammy";
import { Hono } from "hono";
import axios from "axios";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/webhook", async (c) => {
  const bot = new Bot(c.env.BOT_TOKEN);

  bot.command("start", (ctx) => {
    return ctx.reply("Welcome to the bot!");
  });

  bot.command("recipe", async (ctx) => {
    if (!ctx.message?.text) {
      return ctx.reply("Please provide a prompt after /recipe.");
    }
    const prompt = ctx.message?.text.replace("/recipe", "").trim();
    const aiResponse = await callWorkerAI(prompt);
    await ctx.reply(aiResponse);
  });

  // function to call Cloudflare Worker AI using axios
  async function callWorkerAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-2-7b-chat-int8`,
        {
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${c.env.CF_AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.result.response;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.errors?.[0]?.message ||
          "Failed to get AI response", 
      );
    }
  }

  const handler = webhookCallback(bot, "hono");
  return await handler(c);
});

export default app;
