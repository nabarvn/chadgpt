import openai from "@/lib/openai";

export async function GET() {
  const models = await openai.models.list();

  const modelOptions = models.data.map((model) => ({
    value: model.id,
    label: model.id,
  }));

  return new Response(JSON.stringify({ modelOptions }), {
    status: 200,
  });
}
