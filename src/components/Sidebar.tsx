"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import React from "react";

interface Chat {
    id: string;
    title: string;
}

interface ChatSidebarProps {
    chats: Chat[];
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onCreateChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    selectedChatId,
    onSelectChat,
    onDeleteChat,
    onCreateChat,
}) => {
    const { toast } = useToast()
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="m-2 md:hidden">
                    Chats
                </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-4 overflow-y-auto dark:bg-black bg-white">
                <h2 className="text-lg font-bold mb-4">Your Chats</h2>
                {chats.length === 0 && (
                    <p className="text-muted-foreground">No chats yet, create one!</p>
                )}
                {chats.map((chat) => (
                    <Card
                        key={chat.id}
                        className={`p-2 mb-2 cursor-pointer hover:bg-muted ${chat.id === selectedChatId ? "bg-muted" : ""
                            }`}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <div className="flex justify-between items-center">
                            <span className="truncate">{chat.title}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                    toast({
                                        variant: 'destructive',
                                        description: "Your message has been sent.",
                                    });
                                }}
                            >
                                🗑️
                            </Button>
                        </div>
                    </Card>
                ))}

                <Button onClick={onCreateChat} className="mt-4 w-full">
                    + New Chat
                </Button>
            </SheetContent>
        </Sheet>
    );
};

export default ChatSidebar;
