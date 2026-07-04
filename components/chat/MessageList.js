"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef } from "react";

export default function MessageList({ selectedChat, currentUser, setIsTyping }) {
    const bottomRef = useRef(null);
    const conversationId = selectedChat?.conversationId;
    const queryClient = useQueryClient();
    const { data: messages = [], isPending } = useMessages(conversationId);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`typing-${conversationId}`)
            .on("broadcast", { event: "typing" }, () => {
                setIsTyping(true);
            })
            .on("broadcast", { event: "stop-typing" }, () => {
                setIsTyping(false);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            setIsTyping(false);
        };
    }, [conversationId, setIsTyping]);
    useEffect(() => {
        if (!conversationId) return;
        const channel = supabase
            .channel(`messages-${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "message",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    queryClient.setQueryData(["messages", conversationId], (old = []) => {
                        const newMessage = {
                            id: payload.new.id,
                            conversationId: payload.new.conversation_id,
                            senderId: payload.new.sender_id,
                            text: payload.new.text,
                            createdAt: payload.new.created_at,
                        };
                        const exists = old.some((msg) => msg.id === newMessage.id);
                        if (exists) return old;
                        return [...old, newMessage];
                    });
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, queryClient]);
    if (!selectedChat) {
        return (
            <div className="flex flex-1 items-center justify-center text-[#64748B]">
                Select a user to start chat
            </div>
        );
    }
    if (isPending) {
        return (
            <div className="flex flex-1 items-center justify-center text-[#64748B]">
                Loading messages...
            </div>
        );
    }

    return (
        <ScrollArea className="min-h-0 flex-1 bg-[#F8FAFC] p-4">
            <div className="space-y-3">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe
                                    ? "bg-[#3e72e0] text-white"
                                    : "border border-[#E2E8F0] bg-white text-[#0F172A]"
                                    }`}
                            >
                                <p>{msg.text}</p>

                                <p
                                    className={`mt-1 text-[11px] ${isMe ? "text-white/70" : "text-[#94A3B8]"
                                        }`}
                                >
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}