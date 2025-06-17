import type { Context, NextFunction } from "grammy"

export const whitelistMiddleware =
  (whitelist: number[]) =>
  async (ctx: Context, next: NextFunction): Promise<void> => {
    const sender = ctx.message?.from?.id

    if (typeof sender === "undefined" || !whitelist.includes(sender)) {
      ctx.reply("You are not allowed to use the bot.")
      return
    }

    return await next()
  }

export const parseWhitelist = (whitelist: string): number[] => {
  return whitelist.split(",").map(Number)
}