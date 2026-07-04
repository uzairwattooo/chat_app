"use client";

import { useState, useEffect } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { useMe } from "@/hooks/useMe";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const { data: currentUser } = useMe();
    const onlineUsers = useOnlineUsers(currentUser);
    const [isTyping, setIsTyping] = useState(false);
    useEffect(() => {
        const updateLastSeen = () => {
            navigator.sendBeacon("/api/presence");
        };

        window.addEventListener("beforeunload", updateLastSeen);

        return () => {
            window.removeEventListener("beforeunload", updateLastSeen);
        };
    }, []);
    return (
        <div className="h-screen overflow-hidden bg-[#F8FAFC]">
            <div className="flex h-full overflow-hidden">
                <div
                    className={`${selectedChat ? "hidden md:flex" : "flex"
                        } h-full min-h-0 w-full flex-col md:w-[360px]`}
                >
                    <ChatSidebar
                        selectedChat={selectedChat}
                        setSelectedChat={setSelectedChat}
                        onlineUsers={onlineUsers}
                    />
                </div>

                <main
                    className={`${selectedChat ? "flex" : "hidden md:flex"
                        } h-full min-h-0 flex-1 flex-col overflow-hidden`}
                >
                    {selectedChat ? (
                        <>
                            <ChatHeader
                                chat={selectedChat}
                                isTyping={isTyping}
                                onlineUsers={onlineUsers}
                                onBack={() => setSelectedChat(null)}
                            />
                            <MessageList
                                selectedChat={selectedChat}
                                currentUser={currentUser}
                                setIsTyping={setIsTyping}
                            />
                            <MessageInput selectedChat={selectedChat} />
                        </>
                    ) : (
                        <div className="hidden flex-1 items-center justify-center text-[#64748B] md:flex">
                            Select a chat to start messaging
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}