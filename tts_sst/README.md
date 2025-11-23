# Speech Server (Whisper + Kokoro)

A FastAPI-based speech server that provides both Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities using Whisper and Kokoro models.

![Python](https://img.shields.io/badge/Python-3.11-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green) ![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- 🎤 **Speech-to-Text**: Powered by OpenAI's Whisper (faster-whisper implementation)
- 🔊 **Text-to-Speech**: High-quality speech synthesis using Kokoro
- 🚀 **Fast API**: Built with FastAPI for high performance
- 🐳 **Docker Ready**: Easy deployment with Docker
- 🌐 **CORS Enabled**: Works seamlessly with web applications
- 🎯 **Multiple Voices**: Supports various voice options for TTS
- 📤 **Flexible Output**: Supports both MP3 and WAV formats

## 📋 Prerequisites

- Python 3.11+
- Docker (for containerized deployment)
- CUDA GPU (optional, for faster processing)

## 🚀 Installation

### Option 1: Local Setup

1. **Clone the repository**
```bash
cd tts_sst
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the server**
```bash
python app.py
```

The server will start on `http://localhost:9000`

### Option 2: Docker Deployment

1. **Build the Docker image**
```bash
docker build -t tts-stt-server .
```

2. **Run the container**
```bash
docker run -d --name tts-stt-server -p 9000:9000 tts-stt-server
```

3. **Access the API** at `http://localhost:9000`

## 📖 API Documentation

### Health Check

```bash
GET /
```

**Response:**
```json
{
  "status": "ok",
  "whisper": true,
  "kokoro": true
}
```

### Speech-to-Text (STT)

```bash
POST /stt
Content-Type: multipart/form-data
```

**Parameters:**
- `file`: Audio file (wav, mp3, webm, ogg, mpeg)

**Response:**
```json
{
  "text": "transcribed text here",
  "language": "en"
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:9000/stt \
  -F "file=@recording.wav"
```

### Text-to-Speech (TTS)

```bash
POST /tts
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hello, this is a test.",
  "voice": "af_heart",
  "format": "mp3"
}
```

**Parameters:**
- `text` (required): Text to convert to speech
- `voice` (optional): Voice to use (default: `af_heart`)
  - Available voices: `af_heart`, `af_bella`, `am_adam`, `am_michael`, etc.
- `format` (optional): Output format - `mp3` or `wav` (default: `mp3`)

**Response:**
```json
{
  "status": "success",
  "audio_base64": "base64_encoded_audio_data...",
  "format": "mp3"
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:9000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice": "af_heart", "format": "mp3"}'
```

**Example (Python):**
```python
import requests
import base64

response = requests.post(
    "http://localhost:9000/tts",
    json={
        "text": "Hello, this is a test.",
        "voice": "af_heart",
        "format": "mp3"
    }
)

data = response.json()
audio_data = base64.b64decode(data["audio_base64"])

with open("output.mp3", "wb") as f:
    f.write(audio_data)
```

## 🎯 Available Voices

Kokoro supports multiple voices:

- **Female Voices**:
  - `af_heart` (default) - Warm, friendly female voice
  - `af_bella` - Clear, professional female voice
  - `af_sarah` - Soft, gentle female voice

- **Male Voices**:
  - `am_adam` - Deep, authoritative male voice
  - `am_michael` - Clear, professional male voice

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
HOST=0.0.0.0
PORT=9000

# Whisper Model (tiny, base, small, medium, large)
WHISPER_MODEL=small

# Device (cpu, cuda)
DEVICE=cpu
```

### Whisper Models

Choose based on your needs:

| Model  | Parameters | Speed    | Accuracy | VRAM   |
|--------|-----------|----------|----------|--------|
| tiny   | 39M       | Fastest  | Good     | ~1GB   |
| base   | 74M       | Fast     | Better   | ~1GB   |
| small  | 244M      | Medium   | Great    | ~2GB   |
| medium | 769M      | Slow     | Excellent| ~5GB   |
| large  | 1550M     | Slowest  | Best     | ~10GB  |

Default: `small` (good balance of speed and accuracy)

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check if port 9000 is already in use
netstat -ano | findstr :9000  # Windows
lsof -i :9000                  # Linux/Mac

# Kill process using port 9000
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # Linux/Mac
```

### Audio Quality Issues

- Try different voices: `af_heart`, `af_bella`, etc.
- Use WAV format for better quality: `"format": "wav"`
- Check input text preprocessing in client application

### Slow Processing

- Use smaller Whisper model: `tiny` or `base`
- Enable CUDA if you have an NVIDIA GPU
- Consider using dedicated hardware for production

### Docker Issues

```bash
# View logs
docker logs tts-stt-server

# Restart container
docker restart tts-stt-server

# Remove and recreate
docker rm -f tts-stt-server
docker run -d --name tts-stt-server -p 9000:9000 tts-stt-server
```

## 📊 Performance

Typical processing times (small model on CPU):

- **STT**: 1-3 seconds for 10-second audio clip
- **TTS**: 0.5-2 seconds for typical sentence (20-30 words)

With GPU acceleration:
- **STT**: 0.2-0.5 seconds for 10-second audio clip
- **TTS**: 0.1-0.3 seconds for typical sentence

## 🛠️ Tech Stack

- **Framework**: FastAPI
- **STT Model**: OpenAI Whisper (faster-whisper)
- **TTS Model**: Kokoro
- **Audio Processing**: pydub, soundfile
- **Server**: Uvicorn

## 📁 Project Structure

```
tts_sst/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker build configuration
├── generated_audio/      # Output directory for audio files
└── README.md            # This file
```

## 🔗 Integration

### With LocalChat

This speech server is designed to work with [LocalChat](https://github.com/Varun-Patkar/AI-Experiments/tree/main/LocalChat):

1. Start this server on port 9000
2. LocalChat will automatically detect and use speech features
3. Voice input button appears in chat interface
4. Read-aloud button appears on messages

### With Other Applications

```javascript
// Speech-to-Text Example
const formData = new FormData();
formData.append('file', audioBlob, 'recording.webm');

const response = await fetch('http://localhost:9000/stt', {
  method: 'POST',
  body: formData
});

const { text } = await response.json();

// Text-to-Speech Example
const response = await fetch('http://localhost:9000/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello world',
    voice: 'af_heart',
    format: 'mp3'
  })
});

const { audio_base64 } = await response.json();
const audio = new Audio(`data:audio/mp3;base64,${audio_base64}`);
audio.play();
```

## 🔮 Future Enhancements

- 🎚️ Voice pitch and speed control
- 🌐 Multi-language TTS support
- 📊 Real-time streaming audio
- 🎭 Custom voice training
- 📈 Usage analytics and monitoring
- 🔐 API key authentication
- ⚡ GPU acceleration support
- 🎵 Background music mixing

## 🔗 Related Projects

- **Main Repository**: [AI-Experiments](https://github.com/Varun-Patkar/AI-Experiments)
- **LocalChat**: [LocalChat](https://github.com/Varun-Patkar/AI-Experiments/tree/main/LocalChat) - Chat interface that uses this server

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs by opening an issue
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Acknowledgments

- **[OpenAI Whisper](https://github.com/openai/whisper)** - Speech recognition model
- **[faster-whisper](https://github.com/guillaumekln/faster-whisper)** - Optimized Whisper implementation
- **[Kokoro](https://github.com/remixer-dec/kokoro-fastapi)** - Text-to-speech model
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework

## 👤 Author

**Varun Patkar**
- GitHub: [@Varun-Patkar](https://github.com/Varun-Patkar)
- Repository: [AI-Experiments](https://github.com/Varun-Patkar/AI-Experiments)

---

Made with ❤️ for the local AI community
