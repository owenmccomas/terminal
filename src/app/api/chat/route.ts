import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  const { question } = await req.json();

  // Ask OpenAI for a chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: 'please answer the users question. Do not format it in any way other than a simple response.' }, { role: "user", content: question }],
  });

  // Assuming response is not a stream but a single completion
  // Extract the completion text
  const completion = response.choices[0]?.message?.content;

  // Respond with the completion as a JSON response
  return new Response(JSON.stringify(completion), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
