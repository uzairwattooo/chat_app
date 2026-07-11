"use client";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { useMe } from "@/hooks/useMe";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useRealtime } from "@/hooks/useRealtime";
import { useConversations } from "@/hooks/useConversations";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const { data: currentUser } = useMe();
    const onlineUsers = useOnlineUsers(currentUser);
    const [replyingTo, setReplyingTo] = useState(null);
    const [activityStatus, setActivityStatus] = useState(false);
    const activityChannelRef = useRef(null);
    useRealtime(currentUser);
    useEffect(() => {
        const conversationId = selectedChat?.conversationId;

        if (!conversationId) {
            activityChannelRef.current = null;
            setActivityStatus(false);
            return;
        }

        const channel = supabase
            .channel(`chat-activity-${conversationId}`)
            .on("broadcast", { event: "typing" }, () => {
                setActivityStatus("typing");
            })
            .on("broadcast", { event: "stop-typing" }, () => {
                setActivityStatus(false);
            })
            .on("broadcast", { event: "recording" }, () => {
                setActivityStatus("recording");
            })
            .on("broadcast", { event: "stop-recording" }, () => {
                setActivityStatus(false);
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    activityChannelRef.current = channel;
                }
            });

        return () => {
            activityChannelRef.current = null;
            setActivityStatus(false);
            supabase.removeChannel(channel);
        };
    }, [selectedChat?.conversationId]);
    useEffect(() => {
        const updateLastSeen = () => {
            navigator.sendBeacon("/api/presence");
        };

        window.addEventListener("beforeunload", updateLastSeen);

        return () => {
            window.removeEventListener("beforeunload", updateLastSeen);
        };
    }, []);
    const { data: conversations = [] } = useConversations();

    const activeConversation = conversations.find(
        (item) => item.conversationId === selectedChat?.conversationId
    );

    const activeChat = activeConversation
        ? {
            id: activeConversation.user.id,
            name: activeConversation.user.name,
            email: activeConversation.user.email,
            image: activeConversation.user.image,
            lastSeen: activeConversation.user.lastSeen,
            conversationId: activeConversation.conversationId,
        }
        : selectedChat;

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
                        currentUser={currentUser}

                    />
                </div>

                <main
                    className={`${selectedChat ? "flex" : "hidden md:flex"
                        } h-full min-h-0 flex-1 flex-col overflow-hidden`}
                >
                    {selectedChat ? (
                        <>
                            <ChatHeader
                                chat={activeChat}
                                isTyping={activityStatus}
                                onlineUsers={onlineUsers}
                                onBack={() => setSelectedChat(null)}
                                onDeleteChat={() => setSelectedChat(null)}
                            />
                            <MessageList
                                selectedChat={activeChat}
                                currentUser={currentUser}
                                onlineUsers={onlineUsers}
                                setEditingMessage={setEditingMessage}
                                setReplyingTo={setReplyingTo}
                            />
                            <MessageInput
                                selectedChat={activeChat}
                                currentUser={currentUser}
                                editingMessage={editingMessage}
                                setEditingMessage={setEditingMessage}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                activityChannelRef={activityChannelRef}
                            />
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