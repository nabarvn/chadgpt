import openai from "./configuration";

export async function query(prompt: string, id: string, model: string) {
  const response = await openai
    .createCompletion({
      model,
      prompt,
      user: id,
      temperature: 0.9,
      top_p: 1,
      max_tokens: 3000,
      frequency_penalty: 1,
      presence_penalty: 1,
    })
    .then((res) => res.data.choices[0].text)
    .catch((err) => `Please try again! (Error: ${err.message})`);

  return response;
}
