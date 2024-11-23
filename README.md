# Character Extraction and Story Generation Application

## Overview
This Next.js application uses AI to analyze text documents, extract character information, and generate creative stories based on the extracted characters. It leverages OpenAI's GPT models for text analysis and creative writing.

## Features
- **Text Document Processing**: Upload and process text files
- **Character Extraction**: Automatically identifies and extracts character information including:
  - Character names
  - Physical descriptions
  - Personality traits
- **Story Generation**: Creates original stories featuring the extracted characters
- **Vector Indexing**: Implements efficient text chunking and embedding for large documents
- **Interactive UI**: Clean, responsive interface with real-time feedback

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Next.js 13+

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OpenAI_RAG.git
cd OpenAI_RAG
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add:
```
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Document Upload
1. Click "Upload source text file" to select a text document
2. Supported format: .txt files

### Character Extraction
1. Adjust chunk size and overlap settings if needed
2. Click "Build Index" to process the document
3. Click "Extract Characters" to analyze and identify characters
4. View extracted character information in the table format

### Story Generation
1. After character extraction, click "Generate Story"
2. Wait for the AI to create a unique story featuring the extracted characters
3. View the generated story in the output text area

## Technical Details

### Components
- `index.tsx`: Main application interface
- `/api/extractcharacters`: Character extraction endpoint
- `/api/generatestory`: Story generation endpoint
- `/api/splitandembed`: Text processing and embedding endpoint

### Key Technologies
- Next.js
- OpenAI GPT-3.5
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Text Processing
- Chunk size: Default 1024 tokens
- Chunk overlap: Default 20 tokens
- Vector embedding for efficient text analysis

## Configuration Options

### Chunk Settings
- **Chunk Size**: Controls the size of text segments (1-3000 tokens)
- **Chunk Overlap**: Adjusts context retention between chunks (1-600 tokens)

### Generation Parameters
- **Temperature**: Controls creativity level (0-1)
- **Top P**: Affects response diversity (0-1)

## Limitations
- Maximum file size: Determined by token limits
- Text format: Currently supports .txt files only
- Processing time: Varies with document length

## Error Handling
- Input validation for file formats
- Token limit management
- API error handling and user feedback

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[MIT License](LICENSE)

## Acknowledgments
- OpenAI for GPT models
- Next.js team
- shadcn/ui for components

## Support
For issues and feature requests, please use the GitHub issues page.

---
