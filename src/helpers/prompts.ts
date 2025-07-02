import type { HonoContext } from "@/types"
import { promptContextJson, promptContextTxt, recipePrompt } from "@/constants/prompts"
import { mela_json_schema } from "@/constants/json_schemas"

// TODO: refactor this
export const callWorkerAI = async (
  c: HonoContext,
  prompt: string
): Promise<string> => {
  const response = await c.env.AI.run(
    "@cf/meta/llama-4-scout-17b-16e-instruct",
    {
      // TODO: https://developers.cloudflare.com/workers-ai/features/json-mode/
      stream: true,
      messages: [
        ...promptContextTxt,
        { role: "user", content: recipePrompt(prompt) }
      ],
      max_tokens: 10000,
      temperature: 0.5
    }
  )

  const reader = response.pipeThrough(new TextDecoderStream()).getReader()
  let result = ""
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      if (buffer.trim()) {
        console.warn("Stream ended with unparsed data:", buffer)
      }
      break
    }
    buffer += value
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice("data: ".length).trim()
        if (data === "[DONE]") break

        try {
          const jsonData = JSON.parse(data) as { response: string }
          if (jsonData.response) {
            result += jsonData.response
          }
        } catch (parseError) {
          console.warn("Error parsing JSON:", parseError)
        }
      }
    }
  }

  return result
}

export const callWorkerAIJson = async (
  c: HonoContext,
  prompt: string
): Promise<object> => {
  const response = await c.env.AI.run(
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    {
      messages: [
        ...promptContextJson,
        { role: "user", content: recipePrompt(prompt) }
      ],
      max_tokens: 10000,
      temperature: 0.5,
      response_format: mela_json_schema,
    }
  );

  try {
    let result = response.response;
    return result as unknown as object;
  } catch (err) {
    console.warn("Failed to parse AI response:", {
      error: err,
    });
    return {};
  }


}
