import { openai } from "utils/openai";

// Set the runtime to edge for best performance
export const runtime = "edge";

interface Data {
  question: string;
}

export async function POST(req: Request) {
  const { question } = (await req.json()) as Data;

  // Ask OpenAI for a chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: question }],
  });

  // Assuming response is not a stream but a single completion
  // Extract the completion text
  const completion = response.choices[0]?.message?.content;

  // Respond with the completion as a JSON response
  return new Response(JSON.stringify(completion), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
