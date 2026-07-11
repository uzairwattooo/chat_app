import { useMutation, useQueryClient } from "@tanstack/react-query";

function normalizeMessage(message, fallback = {}) {
    return {
        ...message,
        id: message.id || fallback.messageId,
        conversationId:
            message.conversationId || message.conversation_id || fallback.conversationId,
        senderId: message.senderId || message.sender_id || fallback.currentUserId,
        text: message.text ?? fallback.text ?? "",
        type: message.type || fallback.type || "text",
        fileUrl: message.fileUrl || message.file_url || fallback.fileUrl || null,
        fileName: message.fileName || message.file_name || fallback.fileName || null,
        mimeType: message.mimeType || message.mime_type || fallback.mimeType || null,
        fileSize: message.fileSize ?? message.file_size ?? fallback.fileSize ?? null,
        replyToId:
            message.replyToId || message.reply_to_id || fallback.replyToId || null,
        createdAt: message.createdAt || message.created_at || new Date().toISOString(),
        seen: message.seen ?? false,
        seenAt: message.seenAt || message.seen_at || null,
        editedAt: message.editedAt || message.edited_at || null,
        deletedAt: message.deletedAt || message.deleted_at || null,
        reactions: message.reactions || [],
        sending: false,
        uploading: false,
        uploadProgress: 100,
        failed: false,
    };
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables) => {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageId: variables.messageId,
                    conversationId: variables.conversationId,
                    text: variables.text,
                    type: variables.type || "text",
                    fileUrl: variables.fileUrl || null,
                    fileName: variables.fileName || null,
                    mimeType: variables.mimeType || null,
                    fileSize: variables.fileSize ?? null,
                    replyToId: variables.replyToId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send message");
            return data;
        },

        onMutate: async (variables) => {
            const messageId = variables.messageId || crypto.randomUUID();

            if (variables.skipOptimistic) {
                return { messageId };
            }

            await queryClient.cancelQueries({
                queryKey: ["messages", variables.conversationId],
            });

            const previousMessages =
                queryClient.getQueryData(["messages", variables.conversationId]) || [];

            const optimisticMessage = normalizeMessage(
                {
                    id: messageId,
                    conversationId: variables.conversationId,
                    senderId: variables.currentUserId,
                    text: variables.text || "",
                    type: variables.type || "text",
                    fileUrl: variables.fileUrl || null,
                    fileName: variables.fileName || null,
                    mimeType: variables.mimeType || null,
                    fileSize: variables.fileSize ?? null,
                    replyToId: variables.replyToId || null,
                    createdAt: new Date().toISOString(),
                    reactions: [],
                },
                variables
            );

            optimisticMessage.sending = true;
            optimisticMessage.uploading = false;
            optimisticMessage.uploadProgress = 100;

            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) => {
                    if (old.some((msg) => msg.id === messageId)) return old;
                    return [...old, optimisticMessage];
                }
            );

            return { previousMessages, messageId };
        },

        onSuccess: (data, variables, context) => {
            const realMessage = normalizeMessage(data.message, {
                ...variables,
                messageId: context?.messageId || variables.messageId,
            });

            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) => {
                    const exists = old.some((msg) => msg.id === realMessage.id);

                    if (exists) {
                        return old
                            .map((msg) =>
                                msg.id === realMessage.id
                                    ? { ...msg, ...realMessage }
                                    : msg
                            )
                            .sort(
                                (a, b) =>
                                    new Date(a.createdAt) - new Date(b.createdAt)
                            );
                    }

                    return [...old, realMessage].sort(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                    );
                }
            );

            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },

        onError: (error, variables, context) => {
            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) =>
                    old.map((msg) =>
                        msg.id === (context?.messageId || variables.messageId)
                            ? {
                                ...msg,
                                sending: false,
                                uploading: false,
                                failed: true,
                            }
                            : msg
                    )
            );
        },
    });
}
