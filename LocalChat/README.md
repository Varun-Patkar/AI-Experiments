Remove captcha in proxy
- 🎨 **Beautiful UI**: Modern, dark-themed interface inspired by ChatGPT
- 🖼️ **Vision Support**: Upload and analyze images with vision-capable models (LLaVA, BakLLaVA, etc.)
- 📄 **File Upload**: Upload and analyze text files and code files
- 🤔 **Reasoning Models**: Special support for reasoning models (DeepSeek-R1, Qwen, QwQ)
- 🔄 **Model Switching**: Easy model selection with automatic new chat creation
- 📝 **Markdown Support**: Rich markdown rendering for formatted responses
- 🎯 **Smart Chat Management**: 
  - Prevents empty chat creation
  - Automatic chat titling
  - Delete historical chats
  - Resume conversations with full context
- ⚡ **Stop Generation**: Cancel ongoing responses at any time

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.ai/) installed and running

## Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies**
```bash
npm install
```

3. **Make sure Ollama is running**
```bash
ollama serve
```

Or ensure the Ollama service is running on your system.

## Usage

### Development Mode

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How to Use

1. **Start the App**: Open your browser to `http://localhost:3000`

2. **Ollama Connection Check**: The app will automatically check if Ollama is running. If not, you'll see instructions to start it.

3. **Select a Model**: Click the model selector in the top-right to choose from your available Ollama models.

4. **Start Chatting**: Type your message and press Enter (Shift+Enter for new line).

5. **Upload Files**:
   - Click the image icon to upload images (requires vision-capable model)
   - Click the file icon to upload text/code files

6. **Create New Chat**: Click "New Chat" in the sidebar (only available when current chat has messages)

7. **Switch Models**: Selecting a different model will create a new chat if the current one has messages

8. **View History**: Click on any chat in the sidebar to resume that conversation

9. **Delete Chats**: Click the three-dot menu on any chat and select Delete

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

## Features in Detail

### Chat Context
The app maintains context by sending the last 10 messages (5 conversation pairs) to the model, ensuring coherent multi-turn conversations.

### Reasoning Models
Models like DeepSeek-R1, Qwen, and QwQ are automatically detected and their reasoning process can be viewed in an expandable section.

### Vision Models
Models containing "llava", "bakllava", or "vision" in their name automatically enable image upload functionality.

### Local Storage
All chat history is stored in your browser's localStorage, so your conversations persist across sessions.

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in message
- Stop button: Cancel ongoing generation

## Troubleshooting

### Ollama Not Connected
- Ensure Ollama is installed: `ollama --version`
- Start Ollama service: `ollama serve`
- Check if running: `curl http://localhost:11434/api/tags`

### No Models Available
- Pull a model: `ollama pull llama2`
- List models: `ollama list`

### Image Upload Not Working
- Ensure you're using a vision-capable model (e.g., `ollama pull llava`)
- Check that the model name contains "llava", "bakllava", or "vision"

## Future Enhancements

- 🎤 Whisper-web integration for speech-to-text
- 🔊 Kokoro integration for text-to-speech
- 📊 Token usage statistics
- 🌐 Multi-language support
- 🎨 Customizable themes
- 📤 Export/Import chat history
- 🔍 Search within chats

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown**: React Markdown with GFM support

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Acknowledgments

- Built with [Ollama](https://ollama.ai/)
- Inspired by OpenAI's ChatGPT interface
- UI components inspired by Open WebUI

---

Made with ❤️ for the local LLM community
