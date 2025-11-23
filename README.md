# AI Experiments

A collection of AI-powered projects exploring local LLM capabilities, speech processing, and intelligent interfaces.

![Projects](https://img.shields.io/badge/Projects-2-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Status](https://img.shields.io/badge/Status-Active-success)

> **Note:** While excellent open-source alternatives like Open WebUI exist, this project was built as a deep dive into understanding LLMs, local AI architectures, and hands-on experimentation with different models and integration patterns. It represents my journey in learning how these technologies work together and how to build AI applications from scratch.

## 🚀 Projects

### 1. [LocalChat](./LocalChat)

A feature-rich chat interface for Ollama with vision support, web search, and speech integration.

**Key Features:**
- 🎨 Beautiful ChatGPT-inspired UI
- 🖼️ Vision model support (LLaVA, Qwen-VL)
- 🔍 Intelligent web search with SearXNG
- 🎤 Voice input (Whisper STT)
- 🔊 Read aloud (Kokoro TTS)
- 🤔 Reasoning model support
- 📄 File upload capabilities

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS

**Quick Start:**
```bash
cd LocalChat
npm install
npm run dev
```

[📖 Full Documentation](./LocalChat/README.md)

---

### 2. [Speech Server (tts_sst)](./tts_sst)

FastAPI-based speech server providing Speech-to-Text (Whisper) and Text-to-Speech (Kokoro) capabilities.

**Key Features:**
- 🎤 High-quality speech recognition
- 🔊 Natural text-to-speech synthesis
- 🚀 Fast API with CORS support
- 🐳 Docker-ready deployment
- 🎯 Multiple voice options
- 📤 MP3/WAV output formats

**Tech Stack:** Python, FastAPI, Whisper, Kokoro

**Quick Start:**
```bash
cd tts_sst
pip install -r requirements.txt
python app.py
```

[📖 Full Documentation](./tts_sst/README.md)

---

## 🏗️ Architecture

```
AI Experiments
│
├── LocalChat (Frontend)
│   ├── React + TypeScript Interface
│   ├── Connects to Ollama (localhost:11434)
│   ├── Connects to SearXNG (localhost:8082)
│   └── Connects to Speech Server (localhost:9000)
│
├── tts_sst (Backend Service)
│   ├── Whisper STT Endpoint (/stt)
│   ├── Kokoro TTS Endpoint (/tts)
│   └── Runs on port 9000
│
└── External Services
    ├── Ollama (Local LLM Runtime)
    ├── SearXNG (Privacy Search)
    └── Docker (Container Runtime)
```

## 📋 Prerequisites

### Required
- [Node.js](https://nodejs.org/) v18+ (for LocalChat)
- [Python](https://www.python.org/) 3.11+ (for Speech Server)
- [Ollama](https://ollama.ai/) (for LLM backend)

### Optional
- [Docker](https://www.docker.com/) (for containerized deployment)
- [SearXNG](https://github.com/searxng/searxng) (for web search features)

## 🚀 Quick Start (All Services)

### Windows PowerShell Script

Use the included toggle script to start/stop all services:

```powershell
.\Toggle Ollama.ps1
```

This will automatically:
1. Start Docker Desktop
2. Start SearXNG containers (caddy, searxng, redis)
3. Start Speech Server container (tts-stt-server)
4. Start Ollama service
5. Build and start LocalChat container

### Manual Setup

1. **Start Ollama**
```bash
ollama serve
```

2. **Start Speech Server**
```bash
cd tts_sst
docker run -d --name tts-stt-server -p 9000:9000 tts-stt-server
```

3. **Start LocalChat**
```bash
cd LocalChat
docker run -d --name localchat -p 3001:3001 localchat
```

4. **Access LocalChat** at `http://localhost:3001`

## 🎯 Use Cases

### Local AI Assistant
- Private, offline LLM conversations
- No data sent to external servers
- Full control over models and data

### Research & Development
- Test different LLM models locally
- Experiment with vision models
- Explore reasoning capabilities

### Voice Interaction
- Voice-controlled AI assistant
- Text-to-speech for accessibility
- Hands-free operation

### Knowledge Search
- Privacy-respecting web search
- AI-powered answer generation
- Source citation and verification

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0 - UI framework
- **TypeScript** 5.2.2 - Type safety
- **Vite** 5.0.8 - Build tool
- **Tailwind CSS** 3.3.6 - Styling
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python web framework
- **Whisper** - Speech recognition
- **Kokoro** - Text-to-speech
- **Uvicorn** - ASGI server

### AI/ML
- **Ollama** - Local LLM runtime
- **LLaVA** - Vision models
- **Qwen** - Language models
- **DeepSeek-R1** - Reasoning models

### Infrastructure
- **Docker** - Containerization
- **SearXNG** - Privacy search
- **Node.js** - JavaScript runtime

## 📊 Performance

### LocalChat
- **Startup Time**: < 2 seconds
- **Response Time**: Depends on Ollama model
- **Memory Usage**: ~100MB (frontend only)

### Speech Server
- **STT Latency**: 1-3 seconds (10s audio, CPU)
- **TTS Latency**: 0.5-2 seconds (typical sentence)
- **Memory Usage**: ~2GB (with models loaded)

### Combined System
- **Total RAM**: ~4-8GB (depending on LLM model)
- **Disk Space**: ~10-20GB (models + containers)

## 🔮 Roadmap

### LocalChat
- [ ] Multi-file upload support
- [ ] Export/Import chat history
- [ ] Custom themes
- [ ] Mobile app version
- [ ] Real-time voice chat mode

### Speech Server
- [ ] Voice pitch/speed control
- [ ] Multi-language support
- [ ] Streaming audio
- [ ] Custom voice training
- [ ] GPU acceleration

### Infrastructure
- [ ] One-click installer
- [ ] Cloud deployment guides
- [ ] Performance monitoring
- [ ] Usage analytics

## 🐛 Troubleshooting

### Ollama Issues
```bash
# Check if Ollama is running
ollama list

# Start Ollama
ollama serve

# Pull required models
ollama pull llama3.2
ollama pull qwen2.5:1.5b
```

### Docker Issues
```bash
# Check running containers
docker ps

# View logs
docker logs localchat
docker logs tts-stt-server

# Restart containers
docker restart localchat tts-stt-server
```

### Port Conflicts
```bash
# Check ports in use
netstat -ano | findstr "3001 9000 8082 11434"  # Windows
lsof -i :3001,:9000,:8082,:11434                # Linux/Mac
```

## 📝 Documentation

- **[LocalChat Documentation](./LocalChat/README.md)** - Complete guide for the chat interface
- **[Speech Server Documentation](./tts_sst/README.md)** - API reference and integration guide
- **[Ollama Documentation](https://ollama.ai/docs)** - Official Ollama documentation

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed information
2. **Suggest Features**: Propose new features or improvements
3. **Submit PRs**: Fork, make changes, and submit pull requests
4. **Improve Docs**: Help improve documentation
5. **Share**: Star the repo and share with others

## 📄 License

All projects in this repository are licensed under the MIT License. See individual project directories for details.

## 🙏 Acknowledgments

### AI Models & Tools
- **[Ollama](https://ollama.ai/)** - Making local LLMs accessible
- **[OpenAI Whisper](https://github.com/openai/whisper)** - Speech recognition
- **[Kokoro](https://github.com/remixer-dec/kokoro-fastapi)** - Text-to-speech
- **[SearXNG](https://github.com/searxng/searxng)** - Privacy search

### Inspiration
- **ChatGPT** - UI/UX inspiration
- **Open WebUI** - Design patterns
- **LangChain** - Agent concepts

### Community
- Local LLM community for testing and feedback
- Open source contributors
- AI/ML researchers and developers

## 👤 Author

**Varun Patkar**

- GitHub: [@Varun-Patkar](https://github.com/Varun-Patkar)
- Repository: [AI-Experiments](https://github.com/Varun-Patkar/AI-Experiments)
- YouTube Demo: [LocalChat Full Walkthrough](https://youtu.be/wOkEOsk_maA)

## 🌟 Star History

If you find these projects useful, please consider starring the repository!

[![Star History Chart](https://api.star-history.com/svg?repos=Varun-Patkar/AI-Experiments&type=Date)](https://star-history.com/#Varun-Patkar/AI-Experiments&Date)

---

**Made with ❤️ for the local AI community**

*Empowering private, local AI interactions without compromising on features or user experience.*
