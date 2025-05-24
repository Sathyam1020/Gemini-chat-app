// Updated ChatComponent.tsx

'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DialogTitle } from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";

interface Message {
    role: "user" | "model";
    text: string;
}

const ChatComponent: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [currentStream, setCurrentStream] = useState<string>("");
    const [showWelcome, setShowWelcome] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { setTheme } = useTheme();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentStream]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMessage: Message = { role: "user", text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setLoading(true);
        setCurrentStream("");

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

    return (
        <>
            <AnimatePresence>
                {showWelcome && (
                    <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
                        <DialogTitle>
                        </DialogTitle>
                        <DialogContent className="rounded-xl p-6 dark:bg-black bg-white shadow-xl">
                            <motion.div
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="text-center space-y-4"
                            >
                                <span className="text-xl font-bold">Welcome to Gemini Chat</span>
                                <p className="text-muted-foreground">Your AI-powered conversation partner ✨</p>
                                <Button onClick={() => setShowWelcome(false)} className="bg-gray-200 rounded-md dark:bg-gray-800 dark:hover:bg-gray-900 hover:bg-gray-300 transition-all duration-200">Get Started</Button>
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            <div className="flex flex-col h-screen max-w-2xl mx-auto rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted to-background dark:from-[#0f0f0f] dark:via-[#1a1a1a] dark:to-[#0f0f0f] transition-colors duration-500">
                <div className="flex items-center justify-between p-4 text-lg font-semibold backdrop-blur-sm bg-muted/40 border-b border-border">
                    <div>Gemini Chat</div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted/50 transition">
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md border bg-background/90 backdrop-blur-md p-1 shadow-md">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="hover:cursor-pointer dark:hover:bg-gray-900 hover:bg-gray-200">Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:cursor-pointer dark:hover:bg-gray-900 hover:bg-gray-200">Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="hover:cursor-pointer dark:hover:bg-gray-900 hover:bg-gray-200">System</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card
                                className={`w-fit max-w-[70%] ${msg.role === "user"
                                    ? "ml-auto bg-gradient-to-br from-primary/60 to-primary text-primary-foreground"
                                    : "mr-auto bg-gradient-to-br from-muted/50 to-muted text-muted-foreground"
                                    } shadow-sm`}
                            >
                                <CardContent className="p-3 text-sm">
                                    <span className="font-semibold">{msg.role === "user" ? "You:" : "Gemini:"} </span>
                                    {msg.text}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {loading && currentStream && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-fit max-w-[70%] mr-auto bg-muted/50 text-muted-foreground shadow-sm animate-pulse rounded-md p-3 text-sm"
                        >
                            <span className="font-semibold">Gemini: </span>
                            {currentStream}
                        </motion.div>
                    )}

                    {loading && !currentStream && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Typing...
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="flex p-4 gap-2 border-t backdrop-blur-sm bg-muted/40">
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={loading}
                        className="rounded-lg border-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                    <Button onClick={sendMessage} disabled={loading} className="rounded-lg">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                    </Button>
                </div>
            </div>
        </>
    );
};

export default ChatComponent;
