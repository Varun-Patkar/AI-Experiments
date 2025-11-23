import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  FileText,
  X,
  StopCircle,
  Globe,
  Mic,
} from 'lucide-react';
import { readFileAsBase64, readFileAsText } from '../utils';
import { speechService } from '../speech';

interface ChatInputProps {
  onSendMessage: (
    content: string,
    images?: string[],
    abortController?: AbortController
  ) => void;
  disabled: boolean;
  isGenerating: boolean;
  onStopGeneration: () => void;
  supportsVision: boolean;
  searchEnabled: boolean;
  isSearchAvailable: boolean;
  searchError: string | null;
  onToggleSearch: () => void;
}

interface FilePreview {
  type: 'image' | 'text';
  name: string;
  content: string;
  size: number;
}

export default function ChatInput({
  onSendMessage,
  disabled,
  isGenerating,
  onStopGeneration,
  supportsVision,
  searchEnabled,
  onToggleSearch,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = [];

    for (const file of uploadedFiles) {
      if (file.type.startsWith('image/')) {
        const base64 = await readFileAsBase64(file);
        newFiles.push({
          type: 'image',
          name: file.name,
          content: base64,
          size: file.size,
        });
      }
    }

    setFiles([...files, ...newFiles]);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = [];

    for (const file of uploadedFiles) {
      if (
        file.type === 'text/plain' ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.java') ||
        file.name.endsWith('.cpp') ||
        file.name.endsWith('.c') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json')
      ) {
        const text = await readFileAsText(file);
        newFiles.push({
          type: 'text',
          name: file.name,
          content: text,
          size: file.size,
        });
      }
    }

    setFiles([...files, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;
    if (disabled || isGenerating) return;

    let messageContent = input;

    // Add text file contents to the message
    const textFiles = files.filter((f) => f.type === 'text');
    if (textFiles.length > 0) {
      messageContent += '\n\n';
      textFiles.forEach((file) => {
        messageContent += `\n--- ${file.name} ---\n${file.content}\n`;
      });
    }

    const images = files.filter((f) => f.type === 'image').map((f) => f.content);

    onSendMessage(messageContent, images.length > 0 ? images : undefined);
    setInput('');
    setFiles([]);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!supportsVision) return;

    const items = e.clipboardData.items;
    const newFiles: FilePreview[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const base64 = await readFileAsBase64(blob);
          newFiles.push({
            type: 'image',
            name: `pasted-image-${Date.now()}.png`,
            content: base64,
            size: blob.size,
          });
        }
      }
    }

    if (newFiles.length > 0) {
      setFiles([...files, ...newFiles]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceInput = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // Convert speech to text
            const transcription = await speechService.speechToText(audioBlob);
            
            // Refine transcription with LLM
            const refinedText = await speechService.refineTranscription(transcription);
            
            // Set the refined text as input
            setInput(refinedText);
            
            // Focus the textarea
            textareaRef.current?.focus();
          } catch (error) {
            console.error('Voice input error:', error);
            alert('Failed to process voice input. Make sure the speech service is running on port 9000.');
          } finally {
            setIsProcessingAudio(false);
          }

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access error:', error);
        alert('Could not access microphone. Please grant permission.');
      }
    } else {
      // Stop recording
      setIsRecording(false);
      setIsProcessingAudio(true);
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="border-t border-slate-700 bg-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* File Previews */}
        {files.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative bg-slate-700 rounded-lg p-2 pr-8 flex items-center gap-2"
              >
                {file.type === 'image' ? (
                  <>
                    <img
                      src={`data:image/png;base64,${file.content}`}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="text-xs text-gray-300">
                      <div className="font-medium truncate max-w-[150px]">
                        {file.name}
                      </div>
                      <div className="text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-blue-400" />
                    <div className="text-xs text-gray-300">
                      <div className="font-medium truncate max-w-[150px]">
                        {file.name}
                      </div>
                      <div className="text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 p-1 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
          {/* File Upload Inputs (Hidden) */}
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.md,.json"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Image Upload Button (Only for vision models) */}
          {supportsVision && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isGenerating}
              className="px-3 bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end h-[46px]"
              title="Upload images"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          )}

          {/* Text/Code File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isGenerating}
            className="px-3 bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end h-[46px]"
            title="Upload text/code files"
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Web Search Toggle Button */}
          <button
            type="button"
            onClick={onToggleSearch}
            disabled={disabled || isGenerating}
            className={`px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end h-[46px] ${
              searchEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-gray-200'
            }`}
            title={searchEnabled ? 'Web search: ON' : 'Web search: OFF'}
          >
            <Globe className="w-5 h-5" />
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={disabled || isGenerating || isProcessingAudio}
            className={`px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end h-[46px] ${
              isProcessingAudio
                ? 'bg-blue-600 text-white'
                : isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-gray-200'
            }`}
            title={isProcessingAudio ? 'Processing...' : isRecording ? 'Click to stop recording' : 'Voice input'}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={disabled || isGenerating}
            className="flex-1 bg-slate-700 text-gray-200 rounded-lg px-4 py-3 resize-none max-h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[46px]"
            rows={1}
          />

          {/* Submit/Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center self-end h-[46px]"
              title="Stop generation"
            >
              <StopCircle className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || (!input.trim() && files.length === 0)}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end h-[46px]"
              title="Send message"
            >
              <Send className="w-6 h-6" />
            </button>
          )}
        </form>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
