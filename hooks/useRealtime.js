"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getMessageTimestamp } from "@/lib/date";
import { toast } from "sonner";

function normalizeRealtimeDate(value) {
    if (!value) return new Date().toISOString();

    const stringValue = String(value);

    if (
        stringValue.endsWith("Z") ||
        /[+-]\d{2}:\d{2}$/.test(stringValue)
    ) {
        return stringValue;
    }

    return `${stringValue}Z`;
}

function normalizeMessage(raw) {
    return {
        id: raw.id,
        conversationId: raw.conversation_id,
        senderId: raw.sender_id,
        text: raw.text,
        type: raw.type || "text",
        fileUrl: raw.file_url || null,
        fileName: raw.file_name || null,
        mimeType: raw.mime_type || null,
        fileSize: raw.file_size ?? null,
        replyToId: raw.reply_to_id || null,
        seen: raw.seen ?? false,

        seenAt: raw.seen_at
            ? normalizeRealtimeDate(raw.seen_at)
            : null,

        editedAt: raw.edited_at
            ? normalizeRealtimeDate(raw.edited_at)
            : null,

        deletedAt: raw.deleted_at
            ? normalizeRealtimeDate(raw.deleted_at)
            : null,

        createdAt: normalizeRealtimeDate(
            raw.created_at || raw.createdAt
        ),

        reactions: [],
        sending: false,
        uploading: false,
        uploadProgress: 100,
        failed: false,
    };
}
export function useRealtime(currentUser, activeConversationId,
    onOpenConversation) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!currentUser?.id) return;

        const channel = supabase
            .channel(`chat-realtime-${currentUser.id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "message" },
                (payload) => {
                    const realtimeMessage = normalizeMessage(payload.new);
                    const conversationId = realtimeMessage.conversationId;
                    if (!conversationId) return;

                    queryClient.setQueryData(
                        ["messages", conversationId],
                        (old = []) => {
                            const existing = old.find(
                                (msg) => msg.id === realtimeMessage.id
                            );

                            if (existing) {
                                return old
                                    .map((msg) =>
                                        msg.id === realtimeMessage.id
                                            ? {
                                                ...msg,
                                                ...realtimeMessage,
                                                reactions: msg.reactions || [],
                                            }
                                            : msg
                                    )
                                    .sort(
                                        (a, b) =>
                                            getMessageTimestamp(a.createdAt) -
                                            getMessageTimestamp(b.createdAt)
                                    );
                            }

                            return [...old, realtimeMessage].sort(
                                (a, b) =>
                                    getMessageTimestamp(a.createdAt) -
                                    getMessageTimestamp(b.createdAt)
                            );
                        }
                    );
                    queryClient.setQueryData(
                        ["conversations"],
                        (old = []) =>
                            old.map((conversation) => {
                                if (
                                    conversation.conversationId !==
                                    realtimeMessage.conversationId
                                ) {
                                    return conversation;
                                }

                                const isMyMessage =
                                    realtimeMessage.senderId ===
                                    currentUser.id;

                                const isOpenChat =
                                    realtimeMessage.conversationId ===
                                    activeConversationId;

                                return {
                                    ...conversation,

                                    lastMessage:
                                        realtimeMessage.type === "image"
                                            ? "📷 Image"
                                            : realtimeMessage.type === "video"
                                                ? "🎥 Video"
                                                : realtimeMessage.type === "audio"
                                                    ? "🎤 Voice message"
                                                    : realtimeMessage.type === "file"
                                                        ? `📄 ${realtimeMessage.fileName ||
                                                        "Document"
                                                        }`
                                                        : realtimeMessage.text,

                                    lastMessageTime:
                                        realtimeMessage.createdAt,

                                    unreadCount:
                                        !isMyMessage && !isOpenChat
                                            ? (conversation.unreadCount || 0) + 1
                                            : conversation.unreadCount || 0,
                                };
                            })
                    );
                    const isMyMessage =
                        realtimeMessage.senderId === currentUser.id;

                    const isCurrentChat =
                        realtimeMessage.conversationId === activeConversationId;

                    if (!isMyMessage && !isCurrentChat) {
                        const conversations =
                            queryClient.getQueryData(["conversations"]) || [];

                        const conversation = conversations.find(
                            (item) =>
                                item.conversationId ===
                                realtimeMessage.conversationId
                        );

                        const senderName =
                            conversation?.user?.name || "New message";

                        const senderImage =
                            conversation?.user?.image || "";

                        let notificationText = realtimeMessage.text;

                        if (realtimeMessage.type === "image") {
                            notificationText = "📷 Sent an image";
                        }

                        if (realtimeMessage.type === "video") {
                            notificationText = "🎥 Sent a video";
                        }

                        if (realtimeMessage.type === "audio") {
                            notificationText = "🎤 Sent a voice message";
                        }

                        if (realtimeMessage.type === "file") {
                            notificationText = `📄 ${realtimeMessage.fileName || "Sent a document"
                                }`;
                        }

                        toast.custom(
                            (toastId) => (
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast.dismiss(toastId);

                                        if (conversation) {
                                            onOpenConversation?.({
                                                id: conversation.user.id,
                                                name: conversation.user.name,
                                                email: conversation.user.email,
                                                image: conversation.user.image,
                                                lastSeen: conversation.user.lastSeen,
                                                conversationId:
                                                    conversation.conversationId,
                                            });
                                        }
                                    }}
                                    className="flex w-[340px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-600">
                                        {senderImage ? (
                                            <img
                                                src={senderImage}
                                                alt={senderName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            senderName.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {senderName}
                                        </p>

                                        <p className="truncate text-sm text-slate-500">
                                            {notificationText}
                                        </p>
                                    </div>

                                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                </button>
                            ),
                            {
                                duration: 5000,
                                position: "top-right",
                            }
                        );
                    }
                    queryClient.invalidateQueries({ queryKey: ["conversations"] });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "message" },
                (payload) => {
                    const updated = normalizeMessage(payload.new);
                    if (!updated.conversationId) return;

                    queryClient.setQueryData(
                        ["messages", updated.conversationId],
                        (old = []) =>
                            old.map((msg) =>
                                msg.id === updated.id
                                    ? {
                                        ...msg,
                                        ...updated,
                                        reactions: msg.reactions || [],
                                    }
                                    : msg
                            )
                    );

                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "message" },
                (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;

                    queryClient.setQueriesData(
                        { queryKey: ["messages"] },
                        (old = []) => old.filter((msg) => msg.id !== deletedId)
                    );
                    queryClient.invalidateQueries({ queryKey: ["conversations"] });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "message_reaction",
                },
                (payload) => {
                    const reaction = {
                        id: payload.new.id,
                        messageId: payload.new.message_id,
                        userId: payload.new.user_id,
                        emoji: payload.new.emoji,
                    };

                    queryClient.setQueriesData(
                        { queryKey: ["messages"] },
                        (old = []) =>
                            old.map((msg) => {
                                if (msg.id !== reaction.messageId) return msg;
                                const reactions = (msg.reactions || []).filter(
                                    (item) => item.userId !== reaction.userId
                                );
                                return {
                                    ...msg,
                                    reactions: [...reactions, reaction],
                                };
                            })
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "message_reaction",
                },
                (payload) => {
                    const reaction = {
                        id: payload.new.id,
                        messageId: payload.new.message_id,
                        userId: payload.new.user_id,
                        emoji: payload.new.emoji,
                    };

                    queryClient.setQueriesData(
                        { queryKey: ["messages"] },
                        (old = []) =>
                            old.map((msg) =>
                                msg.id === reaction.messageId
                                    ? {
                                        ...msg,
                                        reactions: (msg.reactions || []).map((item) =>
                                            item.id === reaction.id ? reaction : item
                                        ),
                                    }
                                    : msg
                            )
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "message_reaction",
                },
                (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;

                    queryClient.setQueriesData(
                        { queryKey: ["messages"] },
                        (old = []) =>
                            old.map((msg) => ({
                                ...msg,
                                reactions: (msg.reactions || []).filter(
                                    (reaction) => reaction.id !== deletedId
                                ),
                            }))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [
        currentUser?.id,
        activeConversationId,
        onOpenConversation,
        queryClient,
    ]);
}
