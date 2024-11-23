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

const MAX_TOKENS_PER_REQUEST = 12000; // Conservative limit to leave room for response

function chunkText(text: string, maxTokens: number): string[] {
  // Rough estimation: 1 token ≈ 4 characters
  const charsPerChunk = maxTokens * 4;
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += charsPerChunk) {
    chunks.push(text.slice(i, i + charsPerChunk));
  }

  return chunks;
}

async function analyzeChunk(chunk: string, temperature: number, topP: number) {
  const prompt = `
    Analyze the following text and extract information about all characters mentioned.
    For each character, provide:
    1. Name
    2. Physical description and/or role (if available)
    3. Personality traits and characteristics (if available)

    Format the output as a JSON array of objects with the following structure:
    {
      "characters": [
        {
          "name": "character name",
          "description": "physical description or role",
          "personality": "personality traits"
        }
      ]
    }

    If any field is not available in the text, use "Not specified" as the value.
    Only include characters that are actually mentioned in the text.
    
    Text to analyze:
    ${chunk}
  `;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    temperature: temperature || 0.1,
    top_p: topP || 1,
    response_format: { type: "json_object" }
  });

  return completion.choices[0]?.message?.content;
}

// Helper function to merge character arrays and remove duplicates
function mergeCharacters(charactersArrays: Character[][]): Character[] {
  const characterMap = new Map<string, Character>();

  charactersArrays.flat().forEach(char => {
    const existingChar = characterMap.get(char.name);
    if (!existingChar) {
      characterMap.set(char.name, char);
    } else {
      // Merge descriptions and personalities if they contain different information
      const newDesc = char.description !== 'Not specified' ? char.description : existingChar.description;
      const newPers = char.personality !== 'Not specified' ? char.personality : existingChar.personality;

      characterMap.set(char.name, {
        ...existingChar,
        description: newDesc,
        personality: newPers
      });
    }
  });

  return Array.from(characterMap.values());
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nodesWithEmbedding, temperature, topP } = req.body;

    if (!nodesWithEmbedding || !Array.isArray(nodesWithEmbedding)) {
      return res.status(400).json({ error: 'Invalid or missing nodesWithEmbedding' });
    }

    // Combine all text chunks into one string
    const fullText = nodesWithEmbedding.map(node => node.text).join(' ');

    // Split text into manageable chunks
    const textChunks = chunkText(fullText, MAX_TOKENS_PER_REQUEST);

    // Process each chunk
    const chunkResults = await Promise.all(
      textChunks.map(chunk => analyzeChunk(chunk, temperature, topP))
    );

    // Parse and combine results
    const allCharacters = chunkResults.map(result => {
      try {
        const parsed = JSON.parse(result || '{"characters": []}');
        return parsed.characters || [];
      } catch (error) {
        console.error('Error parsing chunk result:', error);
        return [];
      }
    });

    // Merge characters from all chunks and remove duplicates
    const mergedCharacters = mergeCharacters(allCharacters);

    // Return the merged characters
    return res.status(200).json({
      payload: {
        characters: mergedCharacters
      }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
}