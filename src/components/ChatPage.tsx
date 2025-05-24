'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Separator } from "@/components/ui/separator"; 
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; // Assuming you have this
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Github, Loader2, MessageSquare, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { nanoid } from 'nanoid';
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";

interface Message {
    role: "user" | "model";
    text: string;
}

interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

const ChatComponent: React.FC = () => {
    const [chatId, setChatId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [currentStream, setCurrentStream] = useState<string>("");
    const [showWelcome, setShowWelcome] = useState(true);
    const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { setTheme } = useTheme();

    useEffect(() => {
        loadAllChats();
        const existingChatId = localStorage.getItem('currentChatId');
        if (existingChatId) {
            loadChat(existingChatId);
            setShowWelcome(false); // Don't show welcome if a chat is loaded
        } else {
            createNewChat(); // Start a new chat if none exists
        }
    }, []);

    useEffect(() => {
        // Save current chat when messages or ID change
        if (chatId && messages.length > 0) {
            const currentChatIndex = chatHistories.findIndex(chat => chat.id === chatId);
            const chatData: ChatHistory = {
                id: chatId,
                title: chatHistories[currentChatIndex]?.title || messages[0].text.substring(0, 30) || "New Chat",
                messages,
                timestamp: Date.now(),
            };

            if (currentChatIndex > -1) {
                const updatedHistories = [...chatHistories];
                updatedHistories[currentChatIndex] = chatData;
                setChatHistories(updatedHistories);
            } else {
                setChatHistories(prev => [chatData, ...prev]);
            }
            localStorage.setItem(`chat-${chatId}`, JSON.stringify(chatData));
            localStorage.setItem('currentChatId', chatId);
        } else if (chatId && messages.length === 0) {
            // Ensure empty chats are still saved if they were explicitly created
            const chatData: ChatHistory = {
                id: chatId,
                title: "New Chat",
                messages: [],
                timestamp: Date.now(),
            };
            const currentChatIndex = chatHistories.findIndex(chat => chat.id === chatId);
            if (currentChatIndex === -1) {
                setChatHistories(prev => [chatData, ...prev]);
            }
            localStorage.setItem('currentChatId', chatId); // Still set current chat ID
        }

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, chatId, currentStream, chatHistories.length]); // Added chatHistories.length to trigger save when a new chat is added to histories

    const loadAllChats = () => {
        const histories: ChatHistory[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('chat-')) {
                try {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const parsed: ChatHistory = JSON.parse(stored);
                        histories.push(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing chat history from localStorage", e);
                }
            }
        }
        // Sort by timestamp for most recent first
        setChatHistories(histories.sort((a, b) => b.timestamp - a.timestamp));
    };

    const createNewChat = () => {
        const newId = nanoid(8);
        setChatId(newId);
        setMessages([]);
        setCurrentStream("");
        setLoading(false);
        const newChat: ChatHistory = { id: newId, title: "New Chat", messages: [], timestamp: Date.now() };
        setChatHistories(prev => [newChat, ...prev.filter(chat => chat.id !== newId)]); // Add new chat to the top, remove if duplicate
        localStorage.setItem('currentChatId', newId);
    };

    const loadChat = (id: string) => {
        const stored = localStorage.getItem(`chat-${id}`);
        if (stored) {
            const parsed: ChatHistory = JSON.parse(stored);
            setChatId(parsed.id);
            setMessages(parsed.messages);
            setCurrentStream("");
            setLoading(false);
            localStorage.setItem('currentChatId', id);
        }
        // else {
        //     // If for some reason the chat is in histories but not localStorage, create a new one
        //     createNewChat();
        // }
    };

    const deleteChat = (idToDelete: string) => {
        localStorage.removeItem(`chat-${idToDelete}`);
        const updatedHistories = chatHistories.filter(chat => chat.id !== idToDelete);
        setChatHistories(updatedHistories);

        if (chatId === idToDelete) {
            // If the current chat is deleted, create a new one
            if (updatedHistories.length > 0) {
                loadChat(updatedHistories[0].id); // Load the most recent one
            } else {
                createNewChat(); // Or create a brand new one if no other chats exist
            }
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMessage: Message = { role: "user", text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setLoading(true);
        setCurrentStream("");

        // Dynamically update chat title if it's "New Chat" and this is the first message
        if (messages.length === 0) {
            setChatHistories(prev => prev.map(chat =>
                chat.id === chatId && chat.title === "New Chat"
                    ? { ...chat, title: userMessage.text.substring(0, 30) + (userMessage.text.length > 30 ? "..." : "") }
                    : chat
            ));
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
                setCurrentStream(streamedText);
            }

            setMessages((prev) => [...prev, { role: "model", text: streamedText }]);
            setCurrentStream("");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error sending message:", err);
            setMessages((prev) => [
                ...prev,
                { role: "model", text: `⚠️ Error: ${err.message || "Could not process request."}` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !loading) {
            sendMessage();
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Message copied!");
        }).catch(err => {
            console.error("Copy failed", err);
        });
    };

    return (
        <>
            <AnimatePresence>
                {showWelcome && (
                    <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
                        <DialogTitle /> {/* Needed for accessibility, content is in motion.div */}
                        <DialogContent className="rounded-xl p-6 dark:bg-black bg-white shadow-xl">
                            <motion.div
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="text-center space-y-4"
                            >
                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome to Gemini Chat ✨</span>
                                <p className="text-md text-muted-foreground">Your AI-powered conversation partner.</p>
                                <Button
                                    onClick={() => setShowWelcome(false)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all duration-200"
                                >
                                    Get Started
                                </Button>
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-100 dark:bg-gray-950 border-r border-border flex flex-col p-4 shadow-lg transition-colors duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Gemini Chat</h2>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={createNewChat} className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black text-white text-xs px-2 py-1 rounded-md">New Chat</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Separator className="mb-4 bg-gray-300 dark:bg-gray-700" />
                    <ScrollArea className="flex-1 pr-2">
                        <nav className="space-y-2">
                            {chatHistories.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group
                                        ${chat.id === chatId
                                            ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" // Light blue for light mode, dark blue for dark mode
                                            : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        } transition-colors duration-200`}
                                    onClick={() => loadChat(chat.id)}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="flex-1 text-sm truncate">{chat.title}</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black text-white text-xs px-2 py-1 rounded-md">Delete Chat</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            ))}
                        </nav>
                    </ScrollArea>
                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                                    <Sun className="h-5 w-5 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-5 w-5 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    Theme
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="rounded-md border bg-background/90 backdrop-blur-md p-1 shadow-md">
                                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href="https://github.com/your-username/your-repo" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                                            <Github className="h-5 w-5" />
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black text-white text-xs px-2 py-1 rounded-md">View on GitHub</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <div className="flex flex-col flex-1 max-w-[calc(100%-16rem)] mx-auto rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted to-background dark:from-[#0f0f0f] dark:via-[#1a1a1a] dark:to-[#0f0f0f] transition-colors duration-500">
                    <div className="flex items-center justify-between p-4 text-lg font-semibold backdrop-blur-sm bg-muted/40 border-b border-border">
                        <h1 className="text-gray-800 dark:text-gray-100">
                            {chatHistories.find(chat => chat.id === chatId)?.title || "New Chat"}
                        </h1>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3 pb-4"> {/* Add some padding at the bottom for scroll comfort */}
                            {messages.length === 0 && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center text-muted-foreground py-10"
                                >
                                    <MessageSquare className="h-10 w-10 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                    <p className="text-lg">Start a new conversation!</p>
                                    <p className="text-sm">Type your message below to get started.</p>
                                </motion.div>
                            )}
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card
                                        className={`w-fit max-w-[90%] md:max-w-[70%] ${msg.role === "user"
                                            ? "ml-auto bg-gradient-to-br from-primary/70 to-primary text-primary-foreground"
                                            : "mr-auto bg-gradient-to-br from-muted/60 to-muted text-muted-foreground"
                                            } shadow-md relative group`}
                                    >
                                        <CardContent className="p-3 text-sm flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold">{msg.role === "user" ? "You:" : "Gemini:"}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(msg.text)} className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-black text-white text-xs px-2 py-1 rounded-md">Copy message</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}

                            {loading && currentStream && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-fit max-w-[90%] md:max-w-[70%] mr-auto bg-muted/60 text-muted-foreground shadow-md rounded-md p-3 text-sm animate-pulse"
                                >
                                    <span className="font-semibold">Gemini: </span>
                                    <span className="whitespace-pre-wrap">{currentStream}</span>
                                </motion.div>
                            )}

                            {loading && !currentStream && messages.length > 0 && ( // Show "Typing..." only if there are existing messages
                                <div className="flex items-center text-sm text-muted-foreground mt-4">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gemini is typing...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t backdrop-blur-sm bg-muted/40">
                        <div className="relative flex items-center">
                            <Input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Message Gemini..."
                                disabled={loading}
                                className="rounded-full pr-12 pl-4 py-2 border-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all shadow-sm"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 transition-colors"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Gemini may make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatComponent;
