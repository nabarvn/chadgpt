import { instructions } from "@/app/helpers/constants/system-prompt";
import openai from "./configuration";

export async function query(prompt: string, id: string, model: string) {
  const outboundMessages: GPTMessage[] = [
    {
      role: "system",
      content: instructions,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const response = await openai
    .createChatCompletion({
      model,
      user: id,
      messages: outboundMessages,
      temperature: 0.9,
      top_p: 1,
      max_tokens: 3000,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
      n: 1,
    })
    .then((res) => res.data.choices[0].message?.content)
    .catch((err) => `Please try again! (Error: ${err.message})`);

  return response;
}
