"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages } from "@/hooks/useMessages";
import { useSeenMessages } from "@/hooks/useSeenMessages";
import { MoreVertical } from "lucide-react";
import { Download, FileText } from "lucide-react";
import { useDeleteMessage } from "@/hooks/useDeleteMessage";
import { useEffect, useRef, useState } from "react";
import MediaPreviewModal from "./MediaPreviewModal";
import DownloadableMedia from "./DownloadableMedia";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessageReaction } from "@/hooks/useMessageReaction";

export default function MessageList({
    selectedChat,
    currentUser,
    onlineUsers,
    setEditingMessage,
    setReplyingTo
}) {
    const [previewMedia, setPreviewMedia] = useState(null);
    const bottomRef = useRef(null);
    const conversationId = selectedChat?.conversationId;
    const receiverOnline = onlineUsers?.includes(selectedChat?.id);
    const seenMutation = useSeenMessages();
    const deleteMutation = useDeleteMessage();

    const { data: messages = [], isPending } = useMessages(conversationId);
    const reactionMutation = useMessageReaction();
    const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!conversationId || !currentUser?.id || messages.length === 0) return;

        const hasUnseenReceivedMessage = messages.some(
            (msg) => msg.senderId !== currentUser.id && !msg.seen
        );

        if (hasUnseenReceivedMessage) {
            seenMutation.mutate({ conversationId });
        }
    }, [conversationId, messages, currentUser?.id]);
    const handleEdit = (msg) => {
        if (msg.type !== "text") return;
        if (msg.deletedAt) return;

        setEditingMessage(msg);
    };

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
        <>
            <ScrollArea className="min-h-0 flex-1 bg-[#F8FAFC] p-4">
                <div className="space-y-3">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        const isDeleted = !!msg.deletedAt;
                        const repliedMessage = messages.find(
                            (item) => item.id === msg.replyToId
                        );

                        return (
                            <div
                                key={msg.id}
                                className={`group flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`relative max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? "bg-[#3e72e0] text-white"
                                        : "border border-[#E2E8F0] bg-white text-[#0F172A]"
                                        } ${isDeleted ? "opacity-80 italic" : ""}`}
                                >
                                    {!isDeleted && (
                                        <div
                                            className={`absolute top-1 opacity-0 transition group-hover:opacity-100 ${isMe ? "-left-9" : "-right-9"
                                                }`}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="rounded-full p-1 text-[#64748B] hover:bg-[#E2E8F0]">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align={isMe ? "end" : "start"}>
                                                    <DropdownMenuItem
                                                        onSelect={(event) => event.preventDefault()}
                                                        className="flex gap-2 overflow-x-auto hide-scrollbar"
                                                    >
                                                        {reactionOptions.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() =>
                                                                    reactionMutation.mutate({
                                                                        messageId: msg.id,
                                                                        conversationId,
                                                                        emoji,
                                                                    })
                                                                }
                                                                className="text-lg transition hover:scale-125"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                                        Reply
                                                    </DropdownMenuItem>

                                                    {isMe && msg.type === "text" && (
                                                        <DropdownMenuItem onClick={() => handleEdit(msg)}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}

                                                    {isMe && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                deleteMutation.mutate({
                                                                    messageId: msg.id,
                                                                })
                                                            }
                                                            className="text-red-600"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                    {msg.reactions?.length > 0 && (
                                        <div
                                            className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"
                                                } flex rounded-full border bg-white px-2 py-0.5 shadow-sm`}
                                        >
                                            {[...new Set(msg.reactions.map((item) => item.emoji))].map(
                                                (emoji) => (
                                                    <span key={emoji} className="text-sm">
                                                        {emoji}
                                                    </span>
                                                )
                                            )}

                                            {msg.reactions.length > 1 && (
                                                <span className="ml-1 text-xs text-[#64748B]">
                                                    {msg.reactions.length}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {repliedMessage && !isDeleted && (
                                        <div
                                            className={`mb-2 rounded-lg border-l-4 px-3 py-2 ${isMe
                                                ? "border-white/70 bg-white/10"
                                                : "border-[#2563EB] bg-[#F1F5F9]"
                                                }`}
                                        >
                                            <p className="text-xs font-medium opacity-80">
                                                {repliedMessage.senderId === currentUser?.id
                                                    ? "You"
                                                    : selectedChat?.name}
                                            </p>

                                            <p className="max-w-[220px] truncate text-xs opacity-70">
                                                {repliedMessage.type === "text"
                                                    ? repliedMessage.text
                                                    : repliedMessage.type === "image"
                                                        ? "📷 Image"
                                                        : repliedMessage.type === "video"
                                                            ? "🎥 Video"
                                                            : repliedMessage.type === "audio"
                                                                ? "🎤 Voice message"
                                                                : "📄 Document"}
                                            </p>
                                        </div>
                                    )}
                                    {isDeleted ? (
                                        <p className="italic opacity-70">This message was deleted</p>
                                    ) : ["image", "video", "audio"].includes(msg.type) ? (
                                        <DownloadableMedia
                                            message={msg}
                                            isMe={isMe}
                                            onPreview={setPreviewMedia}
                                        />
                                    ) : msg.type === "file" ? (
                                        <a
                                            href={msg.fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            download={msg.fileName}
                                            className="flex min-w-[220px] items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 text-[#0F172A]"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#2563EB]">
                                                <FileText className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {msg.fileName || "Document"}
                                                </p>

                                                <p className="text-xs text-[#64748B]">
                                                    {msg.fileSize
                                                        ? `${(msg.fileSize / 1024 / 1024).toFixed(2)} MB`
                                                        : "File"}
                                                </p>
                                            </div>

                                            <Download className="h-4 w-4 text-[#64748B]" />
                                        </a>
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}
                                    <div className="mt-1 flex items-center justify-end gap-1">
                                        {msg.editedAt && !isDeleted && (
                                            <span className="text-[11px] opacity-70">edited</span>
                                        )}
                                        <span
                                            className={`text-[11px] ${isMe ? "text-white/70" : "text-[#94A3B8]"
                                                }`}
                                        >
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>

                                        {isMe && !isDeleted && (
                                            <span
                                                className={`text-[12px] font-semibold ${msg.seen
                                                    ? "text-black"
                                                    : receiverOnline
                                                        ? "text-white/80"
                                                        : "text-white/60"
                                                    }`}
                                            >
                                                {msg.seen ? "✓✓" : receiverOnline ? "✓✓" : "✓"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div ref={bottomRef} />
                </div>
            </ScrollArea>
            <MediaPreviewModal
                media={previewMedia}
                open={!!previewMedia}
                onOpenChange={(open) => {
                    if (!open) setPreviewMedia(null);
                }}
            />
        </>
    );
}