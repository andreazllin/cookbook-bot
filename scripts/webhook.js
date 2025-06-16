// This only has to be run once to setup the webhook
const { Bot } = require("grammy")

const webhookUrl = process.argv[2] === "dev" ?
  // Use something like: https://pinggy.io/quickstart/telegram/
  "https://<<INSERT_TUNNEL_URL>>/webhook" :
  "https://<<INSERT_CF_WORKER_URL>>/webhook"

const bot = new Bot(process.env.BOT_TOKEN)

bot.api.deleteWebhook().then(() => {
  console.log("✅ Webhook deleted")
  bot.api.setWebhook(webhookUrl).then(() => {
    console.log("✅ Webhook setup complete")

    bot.api.getWebhookInfo().then((info) => {
      console.log("🔍 Webhook info")
      console.log(info)
    }).catch((err) => {
      console.error("❌ Error getting webhook info")
      console.log(err)
    })
  }).catch((err) => {
    console.error("❌ Error setting webhook")
    console.log(err)
  })
}).catch((err) => {
  console.error("❌ Error deleting webhook")
  console.log(err)
})

