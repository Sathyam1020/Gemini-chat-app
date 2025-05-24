"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useChatStore } from "@/store/chatStore";
import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

export function AppSidebar() {
    const {
        chatHistories,
        chatId,
        setChatId,
        deleteChat,
        createNewChat,
    } = useChatStore();

    const { theme, setTheme } = useTheme();
    const { toast } = useToast();

    const handleCreateNewChat = () => {
        createNewChat();
    };

    const getThemeIcon = () => {
        switch (theme) {
            case "light":
                return <Sun className="h-4 w-4" />;
            case "dark":
                return <Moon className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    return (
        <Sidebar>
            <SidebarHeader className=" bg-white dark:bg-black ">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Your Chats</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {chatHistories.length}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    {getThemeIcon()}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-black text-black dark:text-white cursor-pointer">
                                <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-gray-200 cursor-pointer">
                                    <Sun className="mr-2 h-4 w-4" />
                                    Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                                    <Moon className="mr-2 h-4 w-4" />
                                    Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                                    <Monitor className="mr-2 h-4 w-4" />
                                    System
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="overflow-y-auto bg-white dark:bg-black">
                <div className="p-4">
                    <Button onClick={handleCreateNewChat} className="w-full mb-4">
                        + New Chat
                    </Button>
                </div>

                <SidebarMenu>
                    {chatHistories.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <p>No chats yet</p>
                            <p className="text-sm">Create your first chat!</p>
                        </div>
                    ) : (
                        chatHistories.map((chat) => (
                            <SidebarMenuItem key={chat.id}>
                                <Card
                                    className={`mx-2 mb-2 p-2 cursor-pointer hover:bg-muted transition-colors ${chat.id === chatId ? "bg-muted border-primary" : ""
                                        }`}
                                    onClick={() => setChatId(chat.id)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                            <span className="truncate block font-medium">
                                                {chat.title}
                                            </span>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </AlertDialogTrigger>

                                            <AlertDialogContent className="bg-white dark:bg-black">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. Are you sure you want
                                                        to delete the chat{" "}
                                                        <span className="font-semibold">{chat.title}</span>?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => {
                                                            deleteChat(chat.id);
                                                            toast({
                                                                title: "Deleted",
                                                                description: "Chat was successfully deleted.",
                                                                variant: "destructive",
                                                                className: 'bg-red-500 text-white'
                                                            });
                                                        }}
                                                        className="bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            </SidebarMenuItem>
                        ))
                    )}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}