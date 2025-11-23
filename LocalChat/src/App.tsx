import { useState, useEffect, useRef } from 'react';
import { Settings, ArrowDown } from 'lucide-react';
import OllamaCheck from './components/OllamaCheck';
import Sidebar from './components/Sidebar';
import Message from './components/Message';
import ChatInput from './components/ChatInput';
import { Chat, Message as MessageType, OllamaModel } from './types';
import { storageService } from './storage';
import { ollamaService } from './ollama';
import { searchService } from './search';
import { searchAgent } from './searchAgent';
import { generateId, generateChatTitle, generateAITitle } from './utils';

function App() {
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isSearchAvailable, setIsSearchAvailable] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentlyPlayingAudioId, setCurrentlyPlayingAudioId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((c) => c.id === currentChatId);

  // Load chats from storage and create initial chat if needed
  useEffect(() => {
    if (isOllamaConnected) {
      const savedChats = storageService.getAllChats();
      setChats(savedChats);
      
      // Create initial empty chat if no chats exist
      if (savedChats.length === 0) {
        const initialChat: Chat = {
          id: generateId(),
          title: 'New Chat',
          model: selectedModel || '',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setChats([initialChat]);
        setCurrentChatId(initialChat.id);
      }
    }
  }, [isOllamaConnected, selectedModel]);

  // Load models
  useEffect(() => {
    if (isOllamaConnected) {
      loadModels();
    }
  }, [isOllamaConnected]);

  const checkSearchAvailability = async (): Promise<boolean> => {
    try {
      const available = await searchService.checkConnection();
      setIsSearchAvailable(available);
      if (!available) {
        setSearchError('SearXNG not available. Please start Docker and SearXNG.');
      } else {
        setSearchError(null);
      }
      return available;
    } catch (error) {
      setIsSearchAvailable(false);
      setSearchError('Failed to connect to SearXNG');
      return false;
    }
  };

  // Track scroll position to show/hide scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadModels = async () => {
    try {
      const modelList = await ollamaService.getModels();
      setModels(modelList);
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0].name);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleNewChat = () => {
    // Don't create new chat if current chat is empty
    if (currentChat && currentChat.messages.length === 0) {
      return;
    }

    const newChat: Chat = {
      id: generateId(),
      title: 'New Chat',
      model: selectedModel,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    storageService.deleteChat(chatId);
    setChats(chats.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      chat.title = newTitle;
      chat.updatedAt = Date.now();
      setChats([...chats]);
      storageService.saveChat(chat);
    }
  };

  const handleModelChange = (newModel: string) => {
    // If current chat is not empty, create new chat with new model
    if (currentChat && currentChat.messages.length > 0) {
      const newChat: Chat = {
        id: generateId(),
        title: 'New Chat',
        model: newModel,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setChats([newChat, ...chats]);
      setCurrentChatId(newChat.id);
    } else if (currentChat) {
      // Update current empty chat's model
      const updatedChat = { ...currentChat, model: newModel };
      setChats(chats.map((c) => (c.id === currentChat.id ? updatedChat : c)));
    }

    setSelectedModel(newModel);
    setShowModelSelector(false);
  };

  const handleSendMessage = async (
    content: string,
    images?: string[]
  ) => {
    if (!selectedModel) return;

    // Always create new chat if none exists or create a fresh one
    let chat = currentChat;
    let isNewChat = false;
    
    if (!chat) {
      isNewChat = true;
      chat = {
        id: generateId(),
        title: generateChatTitle(content),
        model: selectedModel,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // Add user message
    const userMessage: MessageType = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      images,
    };

    chat.messages.push(userMessage);

    // Update title if this is the first message
    if (chat.messages.length === 1) {
      chat.title = generateChatTitle(content);
    }

    chat.updatedAt = Date.now();
    
    // Update state properly
    if (isNewChat) {
      const newChats = [chat, ...chats];
      setChats(newChats);
      setCurrentChatId(chat.id);
    } else {
      const updatedChats = chats.map((c) => (c.id === chat!.id ? chat! : c));
      setChats(updatedChats);
    }
    
    storageService.saveChat(chat);

    // Prepare assistant message
    const assistantMessage: MessageType = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    chat.messages.push(assistantMessage);
    
    // Update state with assistant message placeholder
    if (isNewChat) {
      setChats((prevChats) => prevChats.map((c) => (c.id === chat!.id ? chat! : c)));
    } else {
      setChats((prevChats) => prevChats.map((c) => (c.id === chat!.id ? chat! : c)));
    }

    // Start generation
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      // If search is enabled, perform search-enhanced generation
      if (searchEnabled && isSearchAvailable) {
        let searchReasoning = '🔍 Search Mode Enabled\n\n';
        
        // Update UI to show search is starting
        assistantMessage.reasoning = searchReasoning;
        setChats((prevChats) => prevChats.map((c) => (c.id === chat!.id ? chat! : c)));

        try {
          // Use qwen2.5:1.5b for search operations
          const searchResult = await searchAgent.performSearchWithReasoning(
            'qwen2.5:1.5b', // Search model for query generation and evaluation
            content,
            (reasoning, queries) => {
              // Real-time updates during search
              assistantMessage.reasoning = reasoning;
              assistantMessage.searchQueries = queries;
              setChats((prevChats) => prevChats.map((c) => (c.id === chat!.id ? chat! : c)));
            }
          );

          // Store search metadata
          assistantMessage.searchQueries = searchResult.iterations.map(iter => iter.query);
          assistantMessage.searchResults = searchResult.iterations
            .map((iter, idx) => 
              `Search ${idx + 1}: "${iter.query}"\n` +
              `Results: ${iter.results.length} found\n` +
              `Confidence: ${(iter.confidence * 100).toFixed(0)}%`
            )
            .join('\n\n');

          // Store initial search reasoning
          const searchProcessReasoning = searchResult.reasoning;

          // Now use streaming chat to generate final answer with search context
          const searchContextMessage = {
            role: 'user' as const,
            content: `User question: ${content}

Based on the following search results, provide a comprehensive, accurate answer:

${searchResult.searchContext}

Important: Use the search results to provide factual, up-to-date information. Cite sources when possible.`
          };

          let fullResponse = '';
          let fullReasoning = '';

          await ollamaService.chat(
            selectedModel,
            [searchContextMessage],
            (chunk, isReasoning) => {
              if (isReasoning) {
                fullReasoning += chunk;
              } else {
                fullResponse += chunk;
              }

              // Update message in real-time
              assistantMessage.content = fullResponse;
              
              // Combine search process reasoning with final answer reasoning
              let combinedReasoning = searchProcessReasoning;
              if (fullReasoning && ollamaService.isReasoningModel(selectedModel)) {
                combinedReasoning += `\n\n${'─'.repeat(60)}\n💭 Final Answer Reasoning (${selectedModel}):\n${'─'.repeat(60)}\n\n${fullReasoning}`;
              }
              assistantMessage.reasoning = combinedReasoning;

              const updatedChat = {
                ...chat!,
                messages: [...chat!.messages.slice(0, -1), assistantMessage],
              };
              setChats((prevChats) => prevChats.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
            },
            abortControllerRef.current!.signal
          );
        } catch (searchError) {
          // Fall back to regular generation if search fails
          console.error('Search error:', searchError);
          assistantMessage.reasoning += `\n❌ Search failed: ${searchError instanceof Error ? searchError.message : 'Unknown error'}\n\nFalling back to regular generation...\n`;
          setChats((prevChats) => prevChats.map((c) => (c.id === chat!.id ? chat! : c)));
          
          // Continue with regular generation below
          await performRegularGeneration();
        }
      } else {
        // Regular generation without search
        await performRegularGeneration();
      }

      async function performRegularGeneration() {
        // Get context (last 5 messages minimum or all if less)
        const contextMessages = chat!.messages
          .slice(-11) // Last 10 messages (5 pairs of user+assistant) + current
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
          }));

        let fullResponse = '';
        let fullReasoning = '';

        await ollamaService.chat(
          selectedModel,
          contextMessages,
          (chunk, isReasoning) => {
            if (isReasoning) {
              fullReasoning += chunk;
            } else {
              fullResponse += chunk;
            }

            // Update message in real-time
            assistantMessage.content = fullResponse;
            if (fullReasoning && ollamaService.isReasoningModel(selectedModel)) {
              assistantMessage.reasoning = fullReasoning;
            }

            const updatedChat = {
              ...chat!,
              messages: [...chat!.messages.slice(0, -1), assistantMessage],
            };
            setChats((prevChats) => prevChats.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
          },
          abortControllerRef.current!.signal
        );
      }

      // Save final chat
      chat.updatedAt = Date.now();
      storageService.saveChat(chat);

      // Generate AI title after first exchange (user + assistant = 2 messages)
      if (chat.messages.length === 2 && userMessage.content && assistantMessage.content) {
        const aiTitle = await generateAITitle(selectedModel, userMessage.content, assistantMessage.content);
        const updatedChat = { ...chat, title: aiTitle, updatedAt: Date.now() };
        setChats((prevChats) => prevChats.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
        storageService.saveChat(updatedChat);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        assistantMessage.content = `Error: ${error.message}`;
        chat.messages[chat.messages.length - 1] = assistantMessage;
        setChats((prevChats) => prevChats.map((c) => (c.id === chat!.id ? chat! : c)));
        storageService.saveChat(chat);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleToggleSearch = async () => {
    // Check availability when user tries to turn it ON
    if (!searchEnabled) {
      // Check if qwen2.5:1.5b is available
      const hasSearchModel = models.some(m => m.name === 'qwen2.5:1.5b');
      if (!hasSearchModel) {
        alert('Search mode requires "qwen2.5:1.5b" model for query generation and evaluation.\n\nPlease install it first:\n  ollama pull qwen2.5:1.5b');
        return;
      }

      const available = await checkSearchAvailability();
      if (!available) {
        alert(searchError || 'SearXNG not available. Please start Docker and SearXNG.');
      } else {
        setSearchEnabled(true);
      }
    } else {
      setSearchEnabled(false);
    }
  };

  if (!isOllamaConnected) {
    return <OllamaCheck onConnectionVerified={() => setIsOllamaConnected(true)} />;
  }

  const canCreateNewChat = !currentChat || currentChat.messages.length > 0;
  const supportsVision = ollamaService.supportsVision(selectedModel);

  return (
    <div className="flex h-screen bg-slate-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        canCreateNewChat={canCreateNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">💬</span>
              {currentChat?.title || 'LocalChat'}
            </h1>
            {currentChat && (
              <span className="text-sm text-gray-400">
                {currentChat.messages.length} messages
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">{selectedModel || 'Select Model'}</span>
            </button>

            {showModelSelector && (
              <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[250px] max-h-[400px] overflow-y-auto">
                {models.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No models found
                  </div>
                ) : (
                  models.map((model) => (
                    <button
                      key={model.name}
                      onClick={() => handleModelChange(model.name)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                        selectedModel === model.name ? 'bg-slate-700' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {model.details.parameter_size || 'Unknown size'}
                        {ollamaService.supportsVision(model.name) && ' • Vision'}
                        {ollamaService.isReasoningModel(model.name) && ' • Reasoning'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto relative"
          onScroll={handleScroll}
        >
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold mb-2">Welcome to LocalChat</h2>
                <p className="text-gray-400 mb-4">
                  Start a conversation with your local Ollama models
                </p>
                <div className="bg-slate-800 rounded-lg p-4 text-left">
                  <h3 className="font-semibold mb-2">Features:</h3>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Stream responses in real-time</li>
                    <li>• Support for vision models (images)</li>
                    <li>• Upload text and code files</li>
                    <li>• Reasoning model support</li>
                    <li>• Chat history with context</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {currentChat.messages.map((message) => (
                <Message 
                  key={message.id} 
                  message={message}
                  isGenerating={isGenerating}
                  currentlyPlayingId={currentlyPlayingAudioId}
                  onPlayAudio={(id) => setCurrentlyPlayingAudioId(id)}
                  onStopAudio={() => setCurrentlyPlayingAudioId(null)}
                />
              ))}
              <div ref={messagesEndRef} />
              
              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-24 right-8 bg-slate-700 hover:bg-slate-600 text-white rounded-full p-3 shadow-lg transition-all z-10"
                  title="Scroll to bottom"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={!selectedModel}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          supportsVision={supportsVision}
          searchEnabled={searchEnabled}
          isSearchAvailable={isSearchAvailable}
          searchError={searchError}
          onToggleSearch={handleToggleSearch}
        />
      </div>
    </div>
  );
}

export default App;
