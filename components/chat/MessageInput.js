"use client";

import { Image, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function MessageInput({ selectedChat }) {
    const [text, setText] = useState("");
    const typingTimeoutRef = useRef(null);
    const sendMutation = useSendMessage();
    useEffect(() => {
        setText("");
    }, [selectedChat?.conversationId]);
    const handleSend = () => {
        if (!text.trim()) return;
        if (!selectedChat?.conversationId) return;

        sendMutation.mutate({
            conversationId: selectedChat.conversationId,
            text,
        });

        setText("");
    };

    return (
        <div className="border-t border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                    <Smile className="size-5 text-[#64748B]" />
                </Button>

                <Button variant="ghost" size="icon">
                    <Image className="size-5 text-[#64748B]" />
                </Button>

                <Input
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (!selectedChat?.conversationId) return;
                        supabase.channel(`typing-${selectedChat.conversationId}`).send({
                            type: "broadcast",
                            event: "typing",
                            payload: {
                                conversationId: selectedChat.conversationId,
                            },
                        });
                        clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => {
                            supabase.channel(`typing-${selectedChat.conversationId}`).send({
                                type: "broadcast",
                                event: "stop-typing",
                                payload: {
                                    conversationId: selectedChat.conversationId,
                                },
                            });
                        }, 1000);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                    placeholder="Type a message..."
                    className="h-11 flex-1 rounded-xl border-[#E2E8F0] bg-[#F8FAFC]"
                />

                <Button
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                    size="icon"
                    className="h-11 w-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8]"
                >
                    <Send className="size-5" />
                </Button>
            </div>
        </div>
    );
}