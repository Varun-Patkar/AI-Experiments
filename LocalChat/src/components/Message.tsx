import { Copy, User, Bot, FileText, ChevronDown, ChevronRight, Volume2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType } from '../types';
import { copyToClipboard } from '../utils';
import { useState, useEffect, useRef } from 'react';
import { speechService } from '../speech';

interface MessageProps {
  message: MessageType;
  isGenerating?: boolean;
  currentlyPlayingId?: string | null;
  onPlayAudio?: (messageId: string) => void;
  onStopAudio?: () => void;
}

export default function Message({ message, isGenerating, currentlyPlayingId, onPlayAudio, onStopAudio }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [hasCollapsed, setHasCollapsed] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReadAloud = async () => {
    // If currently playing this message, stop it
    if (currentlyPlayingId === message.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      onStopAudio?.();
      return;
    }

    // Stop any other playing audio
    onPlayAudio?.(message.id);

    setIsLoadingAudio(true);
    try {
      const audioBase64 = await speechService.textToSpeech(message.content);
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        onStopAudio?.();
      };

      audio.onerror = () => {
        audioRef.current = null;
        onStopAudio?.();
        alert('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      alert('Failed to generate speech. Make sure the speech service is running on port 9000.');
      onStopAudio?.();
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Auto-collapse reasoning when generation finishes
  useEffect(() => {
    if (!hasCollapsed && message.reasoning && message.content) {
      // Check if generation is complete (content has stopped changing)
      const timer = setTimeout(() => {
        setReasoningExpanded(false);
        setHasCollapsed(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message.content, message.reasoning, hasCollapsed]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const isUser = message.role === 'user';

  return (
    <div
      className={`py-6 px-4 ${
        isUser ? 'bg-slate-800/50' : 'bg-slate-900'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-blue-600' : 'bg-green-600'
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-300">
              {isUser ? 'You' : 'Assistant'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {message.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-700"
                >
                  <img
                    src={`data:image/png;base64,${img}`}
                    alt={`Uploaded ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Reasoning (for reasoning models or search) */}
          {message.reasoning && message.reasoning.trim() && (
            <div className="mb-3 bg-slate-700/30 border border-slate-600/30 rounded-lg">
              <button
                onClick={() => setReasoningExpanded(!reasoningExpanded)}
                className="w-full px-3 py-2 text-xs text-purple-400 font-medium flex items-center gap-2 hover:bg-slate-700/50 transition-colors rounded-lg"
              >
                {reasoningExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <FileText className="w-3 h-3" />
                {reasoningExpanded ? (
                  message.content ? <>Collapse</> : <>💭 Thinking...</>
                ) : (
                  message.searchQueries ? <>View Search Process</> : <>View Reasoning</>
                )}
              </button>
              {reasoningExpanded && (
                <div className="px-3 pb-3 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed border-t border-slate-600/30 pt-2">
                  {message.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Search Results Summary */}
          {message.searchQueries && message.searchQueries.length > 0 && (
            <div className="mb-3 bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-2">
                🔍 Web Searches Performed ({message.searchQueries.length})
              </div>
              <div className="space-y-1">
                {message.searchQueries.map((query, idx) => (
                  <div key={idx} className="text-xs text-gray-400">
                    {idx + 1}. "{query}"
                  </div>
                ))}
              </div>
              {message.searchResults && (
                <div className="mt-2 pt-2 border-t border-blue-600/20">
                  <div className="text-xs text-gray-500 whitespace-pre-wrap">
                    {message.searchResults}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-invert prose-sm max-w-none">
            {isUser ? (
              <div className="text-gray-200 whitespace-pre-wrap">
                {message.content}
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="markdown-content text-gray-200"
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Action Buttons */}
          {!isUser && (
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>

              {/* Read Aloud Button - Only show when generation is complete and not currently generating */}
              {message.content && !isGenerating && (
                <button
                  onClick={handleReadAloud}
                  disabled={isLoadingAudio || (currentlyPlayingId !== null && currentlyPlayingId !== message.id)}
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : currentlyPlayingId === message.id ? (
                    <>
                      <Volume2 className="w-3 h-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      Read Aloud
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
