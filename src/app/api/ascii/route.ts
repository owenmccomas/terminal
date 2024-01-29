import { openai } from "utils/openai";

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
    const { prompt } = await req.json();

    // Ask OpenAI for a chat completion given the prompt
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'The user will prompt you with something to turn into ASCII art. When switching to a new line as needed for the ASCII art, please use a slash "n" character to indicate. This will be interpolated in JSX. Please make this and return it. Only return the ASCII art. Do not label it' }, { role: "user", content: prompt }],
    });

    // Assuming response is not a stream but a single completion
    // Extract the completion text
    const asciiArt = response.choices[0]?.message?.content;

    // Respond with the ASCII art as plain text
    console.log(asciiArt);
    return new Response(asciiArt, {
        headers: {
            'Content-Type': 'text/plain', // Set the content type to plain text
        },
    });
}
