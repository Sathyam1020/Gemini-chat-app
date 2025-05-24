"use client";

import { useToast } from "@/hooks/use-toast";
import { useChatStore } from "@/store/chatStore";
import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
    const {
        getCurrentChat,
        createNewChat,
        sendMessage,
        loading,
        currentStream,
    } = useChatStore();

    const [input, setInput] = useState("");
    const currentChat = getCurrentChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentChat?.messages?.length, loading, currentStream]);

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const messageText = input;
        setInput(""); // Clear input immediately

        await sendMessage(messageText);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleNewChat = () => {
        createNewChat();
    };

    console.log(loading, '----')

    return (
        <div className="flex flex-col h-[calc(100vh-25px)] bg-gradient-to-b from-[#fafafa] to-[#eaeaea] dark:from-[#0f0f0f] dark:to-[#1a1a1a] transition-colors">
            <div className="flex-1 p-4 overflow-y-auto">
                {currentChat ? (
                    <div>
                        <div className="mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
                            <h1 className="text-xl font-bold">{currentChat.title}</h1>
                        </div>

                        <div className="space-y-4">
                            {currentChat.messages?.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        {currentChat.messages?.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`relative group p-3 rounded-2xl max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap mt-2 ${message.role === "user"
                                                    ? "ml-auto bg-gradient-to-br from-[#ff80b5] to-[#9089fc] text-white"
                                                    : "bg-gradient-to-br from-[#d4d4d4] to-[#e4e4e7] dark:from-[#2e2e2e] dark:to-[#3a3a3a] text-black dark:text-white"
                                                    }`}
                                            >
                                                <p>{message.text}</p>

                                                {/* Show copy button only for AI messages */}
                                                {message.role !== "user" && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(message.text);
                                                            toast({
                                                                title: "Copied!",
                                                                description: "AI message copied to clipboard.",
                                                                className: 'bg-green-500 text-white'
                                                            });
                                                        }}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                                                        title="Copy to clipboard"

                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {loading && (
                                            <div className="p-3 rounded-2xl max-w-[75%] bg-gradient-to-br mt-2 from-[#d4d4d4] to-[#e4e4e7] dark:from-[#2e2e2e] dark:to-[#3a3a3a] text-black dark:text-white">
                                                <p className="whitespace-pre-wrap">{currentStream}</p>
                                                <div className="flex items-center">
                                                    <div className="animate-pulse text-xs text-gray-500 dark:text-gray-400">
                                                        AI is typing...
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                No chat selected. Create a new chat to start messaging.
                            </p>
                            <button
                                onClick={handleNewChat}
                                className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#ff80b5] to-[#9089fc] text-white font-medium"
                            >
                                Create New Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] sticky bottom-0">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={loading ? "AI is responding..." : "Type your message..."}
                        className="flex-1 rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1e1e1e] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff80b5]"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || loading}
                        className="rounded-xl bg-gradient-to-br from-[#ff80b5] to-[#9089fc] text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}
