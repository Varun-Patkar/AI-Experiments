import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, MoreVertical, Check, Pencil } from 'lucide-react';
import { Chat } from '../types';
import { formatTimestamp } from '../utils';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  canCreateNewChat: boolean;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onRenameChat,
  canCreateNewChat,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [titleAnimations, setTitleAnimations] = useState<Set<string>>(new Set());
  const [previousTitles, setPreviousTitles] = useState<Map<string, string>>(new Map());
  const [oldTitles, setOldTitles] = useState<Map<string, string>>(new Map());

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    chats.forEach(chat => {
      const prevTitle = previousTitles.get(chat.id);
      if (prevTitle !== undefined && prevTitle !== chat.title && chat.title !== 'New Chat') {
        // Store old title for erase animation
        setOldTitles(prev => new Map(prev).set(chat.id, prevTitle));
        setTitleAnimations(prev => new Set(prev).add(chat.id));
        setTimeout(() => {
          setTitleAnimations(prev => {
            const next = new Set(prev);
            next.delete(chat.id);
            return next;
          });
          // Clean up old title after animation
          setTimeout(() => {
            setOldTitles(prev => {
              const next = new Map(prev);
              next.delete(chat.id);
              return next;
            });
          }, 100);
        }, 2200);
      }
    });
    
    setPreviousTitles(new Map(chats.map(c => [c.id, c.title])));
  }, [chats]);

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId);
      setMenuOpen(null);
    }
  };

  const startEditing = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setMenuOpen(null);
  };

  const saveEdit = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onNewChat}
          disabled={!canCreateNewChat}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors ${
            canCreateNewChat
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-700 text-gray-500 cursor-not-allowed'
          }`}
          title={!canCreateNewChat ? 'Current chat must have messages to create a new chat' : ''}
        >
          <MessageSquare className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-lg mb-1 cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-slate-700'
                    : 'hover:bg-slate-700/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChat(chat.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(menuOpen === chat.id ? null : chat.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'F2' && currentChatId === chat.id) {
                    e.preventDefault();
                    startEditing(e as any, chat);
                  }
                }}
                tabIndex={0}
              >
                <div className="p-3 pr-10">
                  <div className="flex items-start gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      {editingId === chat.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(e as any, chat.id);
                              if (e.key === 'Escape') cancelEdit(e as any);
                            }}
                            className="flex-1 bg-slate-600 text-sm text-gray-200 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={(e) => saveEdit(e, chat.id)}
                            className="p-1 hover:bg-slate-600 rounded flex-shrink-0"
                          >
                            <Check className="w-3 h-3 text-green-400" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="text-sm text-gray-200 truncate relative"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startEditing(e, chat);
                          }}
                        >
                          {titleAnimations.has(chat.id) ? (
                            <>
                              <span className="title-erasing" key={`erase-${chat.id}`}>
                                {oldTitles.get(chat.id) || chat.title}
                              </span>
                              <span className="title-typing" key={`type-${chat.id}`}>
                                {chat.title}
                              </span>
                            </>
                          ) : (
                            <span>{chat.title}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 ml-6">
                    <span>{chat.model}</span>
                    <span>•</span>
                    <span>{formatTimestamp(chat.updatedAt)}</span>
                  </div>
                </div>

                {/* Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === chat.id ? null : chat.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Context Menu */}
                {menuOpen === chat.id && (
                  <div className="absolute top-8 right-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10">
                    <button
                      onClick={(e) => startEditing(e, chat)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 rounded-t-lg w-full"
                    >
                      <Pencil className="w-4 h-4" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-b-lg w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-gray-500 text-center">
          <p className="flex items-center justify-center gap-1">
            <span>💬</span> LocalChat v1.0
          </p>
          <p className="mt-1">Powered by Ollama</p>
        </div>
      </div>
    </div>
  );
}
