import { Chat } from './types';

const STORAGE_KEY = 'localchat_history';

export const storageService = {
  getAllChats: (): Chat[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  },

  saveChat: (chat: Chat): void => {
    try {
      const chats = storageService.getAllChats();
      const existingIndex = chats.findIndex(c => c.id === chat.id);
      
      if (existingIndex >= 0) {
        chats[existingIndex] = chat;
      } else {
        chats.unshift(chat);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  },

  deleteChat: (chatId: string): void => {
    try {
      const chats = storageService.getAllChats();
      const filtered = chats.filter(c => c.id !== chatId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  },

  getChat: (chatId: string): Chat | undefined => {
    const chats = storageService.getAllChats();
    return chats.find(c => c.id === chatId);
  },

  exportChats: (): string => {
    return localStorage.getItem(STORAGE_KEY) || '[]';
  },

  importChats: (data: string): void => {
    try {
      const chats = JSON.parse(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error importing chats:', error);
      throw error;
    }
  }
};
