import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId, text, type = "text",
            fileUrl = null,
            fileName = null,
            mimeType = null,
            fileSize = null,
            replyToId = null,
        }) => {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId, text, type,
                    fileUrl,
                    fileName,
                    mimeType,
                    fileSize,
                    replyToId,

                }),
            });

            if (!res.ok) throw new Error("Failed to send message");
            return res.json();
        },

        onSuccess: (data, variables) => {
            const newMessage = data.message;

            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) => {
                    const exists = old.some((msg) => msg.id === newMessage.id);
                    if (exists) return old;
                    return [...old, newMessage];
                }
            );

            queryClient.setQueryData(["conversations"], (old = []) => {
                const updated = old.map((item) => {
                    if (item.conversationId !== variables.conversationId) return item;

                    return {
                        ...item,
                        lastMessage: newMessage.text,
                        lastMessageTime: newMessage.createdAt,
                    };
                });

                return updated.sort((a, b) => {
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;
                    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
                });
            });
        },
    });
}