import { Configuration, OpenAIApi } from "openai"

export async function getEmbedding(text: string) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
  const openai = new OpenAIApi(configuration);
  const res = await openai.createEmbedding({
    model: "text-embedding-ada-002", 
    input: text,
  })
  return res.data.data[0].embedding
}
