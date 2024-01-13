import readline from 'readline';

import 'dotenv/config';
import OpenAI from 'openai';

import { fetchWiki } from './query';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImagePrompt(query: string, research: string[] = []) {
  const descriptions: string[] = [];
  for (const result of research) {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Based on the following research, describe the biological specimen "${query}" as vividly and accurately as possible:\n\n${research}`,
        },
      ],
      model: 'gpt-4-1106-preview',
    });
    descriptions.push(chatCompletion.choices[0].message.content!);
  }

  // TODO: Generate a final description from all the description

  return descriptions[0];
}

async function generateImage(prompt: string, rewritePrompt = false) {
  const finalPrompt = rewritePrompt
    ? prompt
    : `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:\n\n${prompt}`;
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: finalPrompt,
    n: 1,
    size: '1024x1024',
  });
  const url = response.data[0].url;
  console.log('Generated image:', url);
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    return new Promise<string>((resolve) => {
      rl.question('What do you want to visualize? ', (answer) => {
        resolve(answer);
      });
    });
  };

  while (true) {
    const query = await askQuestion();
    if (query.toLowerCase() === 'exit') {
      rl.close();
      break;
    }
    console.log('Researching...');
    const wikiResearch = await fetchWiki(query);
    console.log('Constructing prompt...');
    const prompt = await generateImagePrompt(query, [wikiResearch]);
    console.log('Generating image...');
    const imageUrl = await generateImage(prompt);
    console.log('Generated:', imageUrl)
  }
}

main();