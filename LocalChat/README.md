# LocalChat

A beautiful, feature-rich chat interface for Ollama with vision support, file uploads, web search, and speech integration.

![LocalChat Interface](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue) ![Vite](https://img.shields.io/badge/Vite-5.0.8-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3.3.6-cyan)

## ✨ Features

- 🎨 **Beautiful UI**: Modern, dark-themed interface inspired by ChatGPT
- 🖼️ **Vision Support**: Upload and analyze images with vision-capable models (LLaVA, BakLLaVA, Qwen-VL, etc.)
- 📄 **File Upload**: Upload and analyze text files and code files
- 🤔 **Reasoning Models**: Special support for reasoning models (DeepSeek-R1, QwQ, Qwen3) with expandable thinking sections
- 🔍 **Web Search Integration**: Powered by SearXNG with iterative query refinement
  - Intelligent search query generation using qwen2.5:1.5b
  - Confidence-based search iteration
  - Final answer generation with your selected model
  - Visible search reasoning process
- 🎤 **Speech-to-Text**: Voice input using Whisper with LLM refinement
- 🔊 **Text-to-Speech**: Read responses aloud using Kokoro TTS with intelligent text preprocessing
- 🔄 **Model Switching**: Easy model selection with automatic new chat creation
- 📝 **Markdown Support**: Rich markdown rendering with syntax highlighting
- 🎯 **Smart Chat Management**: 
  - Prevents empty chat creation
  - Automatic chat titling using lightweight models
  - Delete historical chats
  - Resume conversations with full context
  - Rename chats with inline editing
- ⚡ **Stop Generation**: Cancel ongoing responses at any time
- 💬 **Smooth Scrolling**: Optional auto-scroll with manual scroll-to-bottom button

## 🎯 Demo

Access the live interface at `http://localhost:3001` (when running with Docker) or `http://localhost:5173` (when running in dev mode).

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.ai/) installed and running
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- [SearXNG](https://github.com/searxng/searxng) (optional, for web search features) running on `localhost:8082`
- [Speech Server](../tts_sst) (optional, for voice features) running on `localhost:9000`

## 🚀 Installation

### Option 1: Local Development

1. **Clone or navigate to the project directory**
```bash
cd LocalChat
```

2. **Install dependencies**
```bash
npm install
```

3. **Make sure Ollama is running**
```bash
ollama serve
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the app** at `http://localhost:5173`

### Option 2: Docker Deployment

1. **Build the Docker image**
```bash
docker build -t localchat .
```

2. **Run the container**
```bash
docker run -d --name localchat -p 3001:3001 localchat
```

3. **Access the app** at `http://localhost:3001`

### Option 3: Quick Setup Script (Windows)

Use the PowerShell toggle script in the parent directory to start/stop all services:
```powershell
.\Toggle\ Ollama.ps1
```

This script will:
- Start/stop Docker Desktop
- Start/stop Ollama service
- Start/stop LocalChat container
- Start/stop SearXNG containers
- Start/stop Speech (TTS/STT) server

## 📖 Usage

### Basic Chat

1. **Ollama Connection Check**: The app will automatically check if Ollama is running
2. **Select a Model**: Click the model selector in the top-right corner
3. **Start Chatting**: Type your message and press Enter (Shift+Enter for new line)
4. **Stop Generation**: Click the stop button to cancel ongoing responses

### File Uploads

#### Images (Vision Models)
1. Click the image icon (📷) in the input area
2. Select an image file (PNG, JPEG, GIF, WebP)
3. The image will be analyzed by vision-capable models (LLaVA, BakLLaVA, Qwen-VL)

#### Text/Code Files
1. Click the file icon (📄) in the input area
2. Select a text or code file
3. The content will be included in your message

### Web Search

1. Click the globe icon (🌐) to toggle search mode
2. Type your query
3. Watch as the agent:
   - Generates search queries
   - Evaluates results
   - Refines queries if needed
   - Generates a final answer with citations

### Voice Features

#### Voice Input (Speech-to-Text)
1. Click the microphone icon (🎤)
2. Speak your message
3. Click again to stop recording
4. Transcription will be refined and inserted into the input

#### Read Aloud (Text-to-Speech)
1. Click the speaker icon (🔊) on any message
2. The text will be preprocessed and read aloud
3. Click the stop button to cancel playback

### Chat Management

- **New Chat**: Click "New Chat" in the sidebar (only available when current chat has messages)
- **Switch Chats**: Click any chat in the sidebar to resume that conversation
- **Rename Chat**: Click the three-dot menu and select "Rename"
- **Delete Chat**: Click the three-dot menu and select "Delete"
- **Model Switching**: Selecting a different model creates a new chat (if current has messages)

## 🔧 Configuration

### API Endpoints

The app connects to the following services:

```typescript
// Ollama API
http://localhost:11434/api/chat        // Chat streaming
http://localhost:11434/api/generate    // Title generation
http://localhost:11434/api/tags        // List models

// SearXNG Search
http://localhost:8082/search?q=...&format=json

// Speech Services
http://localhost:9000/stt             // Speech-to-Text (Whisper)
http://localhost:9000/tts             // Text-to-Speech (Kokoro)
```

### Models Used

- **Chat**: User-selected model from Ollama
- **Search**: qwen2.5:1.5b (query generation, evaluation)
- **Titles**: qwen2.5:1.5b or llama3.2:1b (fast generation)
- **Transcription Refinement**: qwen2.5:1.5b
- **Reasoning**: Automatic detection (DeepSeek-R1, QwQ, Qwen3)

## Supported File Types

### Images (Vision Models Only)
- PNG, JPEG, GIF, WebP, etc.

### Text/Code Files
- Plain text (.txt)
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- Markdown (.md)
- JSON (.json)

## 🎯 Features in Detail

### Smart Search Agent

The web search feature uses an iterative approach:

1. **Query Generation**: Uses qwen2.5:1.5b to generate targeted search queries
2. **Result Evaluation**: Analyzes search results and determines if more information is needed
3. **Query Refinement**: Generates follow-up queries if initial results are insufficient
4. **Final Answer**: Uses your selected model to generate a comprehensive answer with proper citations

Search reasoning is displayed in real-time, showing the agent's decision-making process.

### Speech Processing

#### Speech-to-Text (Whisper)
- Records audio from your microphone
- Transcribes using Whisper model
- Refines transcription with qwen2.5:1.5b for better grammar
- Inserts refined text into input

#### Text-to-Speech (Kokoro)
- Preprocesses text to remove emojis, markdown, and formatting
- Expands abbreviations (e.g., STT → speech to text)
- Handles hyphens, arrows, and special characters
- Converts to natural spoken format
- Generates audio using Kokoro TTS
- Supports multiple voices (default: af_heart)

### Chat Context
The app maintains context by sending the last 10 messages (5 conversation pairs) to the model, ensuring coherent multi-turn conversations.

### Reasoning Models
Models like DeepSeek-R1, QwQ, and Qwen3 are automatically detected. Their reasoning process is displayed in an expandable section separate from the final answer.

### Vision Models
Models containing "llava", "bakllava", "qwen", or "vision" in their name automatically enable image upload functionality.

### Local Storage
All chat history is stored in your browser's localStorage, so your conversations persist across sessions. No data is sent to external servers.

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in message
- Stop button: Cancel ongoing generation

## 🐛 Troubleshooting

### Ollama Not Connected
- Ensure Ollama is installed: `ollama --version`
- Start Ollama service: `ollama serve`
- Check if running: `curl http://localhost:11434/api/tags`

### No Models Available
- Pull a model: `ollama pull llama3.2`
- Pull vision model: `ollama pull llava`
- Pull reasoning model: `ollama pull deepseek-r1:1.5b`
- List models: `ollama list`

### Image Upload Not Working
- Ensure you're using a vision-capable model: `ollama pull llava`
- Check that the model name contains "llava", "bakllava", "qwen", or "vision"
- Verify image file format is supported (PNG, JPEG, GIF, WebP)

### Search Not Working
- Ensure SearXNG is running on `localhost:8082`
- Check Docker containers: `docker ps`
- Restart containers: `docker start caddy searxng redis`
- Verify qwen2.5:1.5b is pulled: `ollama pull qwen2.5:1.5b`

### Voice Features Not Working
- Ensure Speech Server is running on `localhost:9000`
- Check container: `docker ps | grep tts-stt-server`
- Restart container: `docker start tts-stt-server`
- Test endpoint: `curl http://localhost:9000/`

### Docker Build Fails
- Remove existing container: `docker rm -f localchat`
- Remove existing image: `docker rmi localchat`
- Clear build cache: `docker builder prune`
- Rebuild: `docker build -t localchat .`

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.3.6
- **Icons**: Lucide React 0.294.0
- **Markdown**: React Markdown 9.0.1 with GFM support
- **Deployment**: Docker with Node.js 20 Alpine

### Backend Services

- **LLM**: Ollama (localhost:11434)
- **Search**: SearXNG (localhost:8082)
- **STT**: Whisper via Speech Server (localhost:9000)
- **TTS**: Kokoro via Speech Server (localhost:9000)

## 🔮 Future Enhancements

- ✅ ~~Speech-to-text integration~~ (Completed)
- ✅ ~~Text-to-speech integration~~ (Completed)
- ✅ ~~Web search with reasoning~~ (Completed)
- 📊 Token usage statistics
- 🌐 Multi-language support for UI
- 🎨 Customizable themes (light mode)
- 📤 Export/Import chat history
- 🔍 Search within chats
- 📎 Multiple file uploads
- 🎙️ Real-time voice chat mode
- 📱 Mobile app version

## 📄 Project Structure

```
LocalChat/
├── src/
│   ├── components/        # React components
│   │   ├── ChatInput.tsx    # Message input with file/voice/search
│   │   ├── Message.tsx      # Message display with TTS
│   │   ├── Sidebar.tsx      # Chat history sidebar
│   │   └── ModelSelector.tsx # Model selection dropdown
│   ├── services/          # API service modules
│   │   ├── ollama.ts        # Ollama API integration
│   │   ├── search.ts        # SearXNG integration
│   │   ├── searchAgent.ts   # Iterative search logic
│   │   └── speech.ts        # Whisper/Kokoro integration
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # Utility functions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── Dockerfile             # Docker build configuration
├── .dockerignore          # Docker ignore patterns
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

## 🔗 Related Projects

- **Main Repository**: [AI-Experiments](https://github.com/Varun-Patkar/AI-Experiments)
- **Speech Server**: [tts_sst](https://github.com/Varun-Patkar/AI-Experiments/tree/main/tts_sst) - Whisper + Kokoro integration

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs by opening an issue
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Acknowledgments

- **[Ollama](https://ollama.ai/)** - Local LLM runtime
- **[Whisper](https://github.com/openai/whisper)** - Speech recognition
- **[Kokoro](https://github.com/remixer-dec/kokoro-fastapi)** - Text-to-speech
- **[SearXNG](https://github.com/searxng/searxng)** - Privacy-respecting search
- **OpenAI's ChatGPT** - UI inspiration
- **[Open WebUI](https://github.com/open-webui/open-webui)** - Design inspiration

## 👤 Author

**Varun Patkar**
- GitHub: [@Varun-Patkar](https://github.com/Varun-Patkar)
- Repository: [AI-Experiments](https://github.com/Varun-Patkar/AI-Experiments)

---

Made with ❤️ for the local LLM community
