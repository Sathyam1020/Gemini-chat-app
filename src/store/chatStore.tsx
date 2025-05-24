import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  role: "user" | "model";
  text: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatStore {
  chatHistories: Chat[];
  chatId: string;
  currentStream: string;
  loading: boolean;
  
  // Actions
  setChatId: (id: string) => void;
  addChat: (chat: Omit<Chat, 'createdAt' | 'updatedAt'>) => void;
  deleteChat: (id: string) => void;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  updateChatTitle: (id: string, title: string) => void;
  createNewChat: () => string; // Returns the new chat ID
  getCurrentChat: () => Chat | undefined;
  clearAllChats: () => void;
  
  // Message actions
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setCurrentStream: (stream: string) => void;
  setLoading: (loading: boolean) => void;
  sendMessage: (input: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chatHistories: [],
      chatId: '',
      currentStream: '',
      loading: false,

      setChatId: (id: string) => set({ chatId: id }),

      addChat: (chatData) => {
        const newChat: Chat = {
          ...chatData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          chatHistories: [newChat, ...state.chatHistories],
          chatId: newChat.id,
        }));
      },

      deleteChat: (id: string) => {
        set((state) => {
          const updatedHistories = state.chatHistories.filter(chat => chat.id !== id);
          const newChatId = state.chatId === id 
            ? (updatedHistories.length > 0 ? updatedHistories[0].id : '')
            : state.chatId;
          
          return {
            chatHistories: updatedHistories,
            chatId: newChatId,
          };
        });
      },

      updateChat: (id: string, updates) => {
        set((state) => ({
          chatHistories: state.chatHistories.map(chat =>
            chat.id === id 
              ? { ...chat, ...updates, updatedAt: new Date() }
              : chat
          ),
        }));
      },

      updateChatTitle: (id: string, title: string) => {
        get().updateChat(id, { title });
      },

      createNewChat: () => {
        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newChat: Chat = {
          id: newChatId,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          chatHistories: [newChat, ...state.chatHistories],
          chatId: newChatId,
        }));
        
        return newChatId;
      },

      getCurrentChat: () => {
        const { chatHistories, chatId } = get();
        return chatHistories.find(chat => chat.id === chatId);
      },

      clearAllChats: () => set({ chatHistories: [], chatId: '' }),

      // Message actions
      addMessage: (chatId: string, message: Message) => {
        set((state) => ({
          chatHistories: state.chatHistories.map(chat =>
            chat.id === chatId
              ? { ...chat, messages: [...chat.messages, message], updatedAt: new Date() }
              : chat
          ),
        }));
      },

      setMessages: (chatId: string, messages: Message[]) => {
        set((state) => ({
          chatHistories: state.chatHistories.map(chat =>
            chat.id === chatId
              ? { ...chat, messages, updatedAt: new Date() }
              : chat
          ),
        }));
      },

      setCurrentStream: (stream: string) => set({ currentStream: stream }),

      setLoading: (loading: boolean) => set({ loading }),

      sendMessage: async (input: string) => {
        if (!input.trim()) return;

        const state = get();
        let targetChatId = state.chatId;

        // Create new chat if none exists
        if (!targetChatId || !state.getCurrentChat()) {
          targetChatId = get().createNewChat();
        }

        const userMessage: Message = { role: "user", text: input };
        const currentChat = get().getCurrentChat();
        const newMessages = [...(currentChat?.messages || []), userMessage];

        // Add user message
        get().setMessages(targetChatId, newMessages);
        set({ loading: true, currentStream: '' });

        // Update chat title if it's the first message and title is "New Chat"
        if (currentChat && currentChat.messages.length === 0 && currentChat.title === "New Chat") {
          const title = userMessage.text.substring(0, 30) + (userMessage.text.length > 30 ? "..." : "");
          get().updateChatTitle(targetChatId, title);
        }

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: newMessages }),
          });

          if (!res.ok) throw new Error(`API Error: ${res.status}`);
          if (!res.body) throw new Error("No response body from API.");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let streamedText = "";

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value, { stream: true });
            streamedText += chunk;
            get().setCurrentStream(streamedText);
          }

          // Add AI response
          get().addMessage(targetChatId, { role: "model", text: streamedText });
          set({ currentStream: '' });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error("Error sending message:", err);
          get().addMessage(targetChatId, {
            role: "model",
            text: `⚠️ Error: ${err.message || "Could not process request."}`
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'chat-storage', // localStorage key
      partialize: (state) => ({
        chatHistories: state.chatHistories,
        chatId: state.chatId,
      }),
    }
  )
);