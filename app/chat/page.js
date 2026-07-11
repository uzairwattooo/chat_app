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
        <div className="chat-shell h-dvh overflow-hidden p-0 md:p-3 lg:p-5">
            <div className="mx-auto flex h-full max-w-[1680px] overflow-hidden bg-white shadow-2xl shadow-indigo-950/10 md:rounded-[28px] md:border md:border-white/80">
                <div
                    className={`${selectedChat ? "hidden md:flex" : "flex"
                        } h-full min-h-0 w-full flex-col md:w-[380px] lg:w-[400px]`}
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
                        } h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50`}
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
                        <div className="hidden flex-1 items-center justify-center px-8 text-center md:flex">
                            <div className="max-w-md">
                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-2xl shadow-indigo-500/25">
                                    <span className="text-4xl">✦</span>
                                </div>
                                <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-900">Your conversations, beautifully organized.</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-500">Choose a conversation from the sidebar or start a new chat to begin messaging.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}