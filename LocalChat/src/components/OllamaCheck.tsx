import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { ollamaService } from '../ollama';

interface OllamaCheckProps {
  onConnectionVerified: () => void;
}

export default function OllamaCheck({ onConnectionVerified }: OllamaCheckProps) {
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    const connected = await ollamaService.checkConnection();
    setIsConnected(connected);
    setChecking(false);
    
    if (connected) {
      onConnectionVerified();
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-300 text-lg">Checking Ollama connection...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="bg-red-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Ollama Not Connected
            </h2>
            
            <p className="text-gray-400 mb-6">
              Please make sure Ollama is running on your system.
            </p>
            
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-2">To start Ollama:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Open a terminal or command prompt</li>
                <li>Run: <code className="bg-slate-600 px-2 py-1 rounded">ollama serve</code></li>
                <li>Or ensure Ollama service is running</li>
              </ol>
            </div>
            
            <button
              onClick={checkConnection}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Retry Connection
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Connecting to: http://localhost:11434
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
