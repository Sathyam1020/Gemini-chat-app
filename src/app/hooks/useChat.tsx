import { useChatStore } from "@/store/chatStore";

export function useChat() {
  const store = useChatStore();
  
  return {
    // Current chat info
    currentChat: store.getCurrentChat(),
    chatId: store.chatId,
    loading: store.loading,
    currentStream: store.currentStream,
    
    // All chats
    chatHistories: store.chatHistories,
    
    // Actions
    sendMessage: store.sendMessage,
    createNewChat: store.createNewChat,
    setChatId: store.setChatId,
    deleteChat: store.deleteChat,
    updateChatTitle: store.updateChatTitle,
    
    // Utilities
    hasActiveChat: !!store.chatId && !!store.getCurrentChat(),
    totalChats: store.chatHistories.length,
  };
}

// Usage example:
// const { currentChat, sendMessage, loading } = useChat();