import Head from "next/head";
import { ChangeEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkedSlider } from "@/components/ui/linkedslider";
import { Textarea } from "@/components/ui/textarea";
import essay from "@/lib/essay";

const DEFAULT_CHUNK_SIZE = 1024;
const DEFAULT_CHUNK_OVERLAP = 20;
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_TOP_P = 1;

interface Character {
  name: string;
  description: string;
  personality: string;
}

export default function Home() {
  const answerId = useId();
  const sourceId = useId();
  const [text, setText] = useState(essay);
  const [needsNewIndex, setNeedsNewIndex] = useState(true);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nodesWithEmbedding, setNodesWithEmbedding] = useState([]);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE.toString());
  const [chunkOverlap, setChunkOverlap] = useState(
    DEFAULT_CHUNK_OVERLAP.toString(),
  );
  const [temperature, setTemperature] = useState(
    DEFAULT_TEMPERATURE.toString(),
  );
  const [topP, setTopP] = useState(DEFAULT_TOP_P.toString());
  const [answer, setAnswer] = useState("");
  const [extractedCharacters, setExtractedCharacters] = useState<Character[]>([]);
  const [showStoryButton, setShowStoryButton] = useState(false);

  const formatCharactersAsTable = (characters: Character[]): string => {
    if (!characters || characters.length === 0) return "No characters found";

    const headers = ["Name", "Description", "Personality"];
    const rows = characters.map((char: Character) =>
      `| ${char.name || 'N/A'} | ${char.description || 'N/A'} | ${char.personality || 'N/A'} |`
    );

    return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.join('\n')}`;
  };

  return (
    <>
      <Head>
        <title>Character Information Extractor</title>
      </Head>
      <main className="mx-2 flex h-full flex-col lg:mx-56">
        <div className="space-y-2">
          <Label>Settings:</Label>
          <div>
            <LinkedSlider
              label="Chunk Size:"
              description={
                "The maximum size of the chunks we are searching over, in tokens. " +
                "The bigger the chunk, the more likely that the information you are looking " +
                "for is in the chunk, but also the more likely that the chunk will contain " +
                "irrelevant information."
              }
              min={1}
              max={3000}
              step={1}
              value={chunkSize}
              onChange={(value: string) => {
                setChunkSize(value);
                setNeedsNewIndex(true);
              }}
            />
          </div>
          <div>
            <LinkedSlider
              label="Chunk Overlap:"
              description={
                "The maximum amount of overlap between chunks, in tokens. " +
                "Overlap helps ensure that sufficient contextual information is retained."
              }
              min={1}
              max={600}
              step={1}
              value={chunkOverlap}
              onChange={(value: string) => {
                setChunkOverlap(value);
                setNeedsNewIndex(true);
              }}
            />
          </div>
        </div>
        <div className="my-2 flex h-3/4 flex-auto flex-col space-y-2">
          <div className="space-y-2">
            <Label>Upload source text file</Label>
            <Input
              id={sourceId}
              type="file"
              accept=".txt"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const fileContent = event.target?.result as string;
                    setText(fileContent);
                    setNeedsNewIndex(true);
                    setShowStoryButton(false);
                  };
                  if (file.type != "text/plain") {
                    console.error(`${file.type} parsing not implemented`);
                    setText("Error");
                  } else {
                    reader.readAsText(file);
                  }
                }
              }}
            />
          </div>
        </div>
        {
          text && (
            <Textarea
              value={text}
              readOnly
              placeholder="File contents will appear here"
              className="flex-1"
            />
          )
        }
        <Button
          disabled={!needsNewIndex || buildingIndex || extracting}
          onClick={async () => {
            setAnswer("Building index...");
            setBuildingIndex(true);
            setNeedsNewIndex(false);
            setShowStoryButton(false);

            const result = await fetch("/api/splitandembed", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                document: text,
                chunkSize: parseInt(chunkSize),
                chunkOverlap: parseInt(chunkOverlap),
              }),
            });
            const { error, payload } = await result.json();

            if (error) {
              setAnswer(error);
            }

            if (payload) {
              setNodesWithEmbedding(payload.nodesWithEmbedding);
              setAnswer("Index built!");
            }

            setBuildingIndex(false);
          }}
        >
          {buildingIndex ? "Building Vector index..." : "Build index"}
        </Button>

        {!buildingIndex && !needsNewIndex && (
          <>
            <Button
              className="my-4"
              disabled={extracting || generating}
              onClick={async () => {
                setAnswer("Extracting characters...");
                setExtracting(true);
                setShowStoryButton(false);

                const result = await fetch("/api/extractcharacters", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    nodesWithEmbedding,
                    temperature: parseFloat(temperature),
                    topP: parseFloat(topP),
                  }),
                });

                const { error, payload } = await result.json();

                if (error) {
                  setAnswer(error);
                }

                if (payload && payload.characters) {
                  setExtractedCharacters(payload.characters);
                  setAnswer(formatCharactersAsTable(payload.characters));
                  setShowStoryButton(true);
                }

                setExtracting(false);
              }}
            >
              Extract Characters
            </Button>

            {showStoryButton && (
              <Button
                className="my-4"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  setAnswer("Generating story...");

                  const result = await fetch("/api/generatestory", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      characters: extractedCharacters,
                      temperature: parseFloat(temperature),
                      topP: parseFloat(topP),
                    }),
                  });

                  const { error, payload } = await result.json();

                  if (error) {
                    setAnswer(error);
                  }

                  if (payload) {
                    setAnswer(payload.story);
                  }

                  setGenerating(false);
                }}
              >
                Generate Story
              </Button>
            )}

            <div className="my-2 flex h-1/4 flex-auto flex-col space-y-2">
              <Label htmlFor={answerId}>Output:</Label>
              <Textarea
                className="flex-1 font-mono"
                readOnly
                value={answer}
                id={answerId}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}