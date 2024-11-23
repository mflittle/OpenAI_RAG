import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Character {
  name: string;
  description: string;
  personality: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { characters, temperature, topP } = req.body;

    if (!characters || !Array.isArray(characters)) {
      return res.status(400).json({ error: 'Invalid or missing characters array' });
    }

    // Create a prompt for story generation
    const prompt = `
      Create an engaging short story using the following characters. Make sure to 
      incorporate their descriptions and personalities naturally into the narrative.
      
      Characters:
      ${characters.map(char =>
      `- ${char.name}:
         Description: ${char.description}
         Personality: ${char.personality}`
    ).join('\n\n')}
      
      Please write a creative story (around 500 words) that:
      1. Introduces the characters naturally
      2. Creates interesting interactions between them
      3. Builds a coherent plot with a beginning, middle, and end
      4. Stays true to each character's described personality
      5. Includes some dialogue to show character dynamics
      
      Story:
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: temperature || 0.7, // Higher temperature for more creative stories
      top_p: topP || 1,
      max_tokens: 1000
    });

    const story = completion.choices[0]?.message?.content;

    if (!story) {
      throw new Error('No story generated');
    }

    return res.status(200).json({
      payload: {
        story
      }
    });

  } catch (error) {
    console.error('Error generating story:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
}