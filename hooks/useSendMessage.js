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
                    const exists = old.some(
                        (msg) => msg.id === newMessage.id
                    );

                    if (exists) {
                        return old.map((msg) =>
                            msg.id === newMessage.id
                                ? {
                                    ...msg,
                                    ...newMessage,
                                    type: newMessage.type || variables.type || "text",
                                    fileUrl:
                                        newMessage.fileUrl ||
                                        newMessage.file_url ||
                                        variables.fileUrl ||
                                        null,
                                    fileName:
                                        newMessage.fileName ||
                                        newMessage.file_name ||
                                        variables.fileName ||
                                        null,
                                    mimeType:
                                        newMessage.mimeType ||
                                        newMessage.mime_type ||
                                        variables.mimeType ||
                                        null,
                                    fileSize:
                                        newMessage.fileSize ??
                                        newMessage.file_size ??
                                        variables.fileSize ??
                                        null,
                                    replyToId:
                                        newMessage.replyToId ||
                                        newMessage.reply_to_id ||
                                        variables.replyToId ||
                                        null,
                                }
                                : msg
                        );
                    }

                    return [
                        ...old,
                        {
                            ...newMessage,
                            type: newMessage.type || variables.type || "text",
                            fileUrl:
                                newMessage.fileUrl ||
                                newMessage.file_url ||
                                variables.fileUrl ||
                                null,
                            fileName:
                                newMessage.fileName ||
                                newMessage.file_name ||
                                variables.fileName ||
                                null,
                            mimeType:
                                newMessage.mimeType ||
                                newMessage.mime_type ||
                                variables.mimeType ||
                                null,
                            fileSize:
                                newMessage.fileSize ??
                                newMessage.file_size ??
                                variables.fileSize ??
                                null,
                            replyToId:
                                newMessage.replyToId ||
                                newMessage.reply_to_id ||
                                variables.replyToId ||
                                null,
                        },
                    ];
                }
            );

            queryClient.setQueryData(["conversations"], (old = []) => {
                const updated = old.map((item) => {
                    if (item.conversationId !== variables.conversationId) {
                        return item;
                    }

                    let lastMessage = newMessage.text;

                    if (variables.type === "image") lastMessage = "📷 Image";
                    if (variables.type === "video") lastMessage = "🎥 Video";
                    if (variables.type === "audio") lastMessage = "🎤 Audio";
                    if (variables.type === "file") {
                        lastMessage = `📄 ${variables.fileName || "Document"}`;
                    }

                    return {
                        ...item,
                        lastMessage,
                        lastMessageTime: newMessage.createdAt,
                    };
                });

                return updated.sort((a, b) => {
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;

                    return (
                        new Date(b.lastMessageTime) -
                        new Date(a.lastMessageTime)
                    );
                });
            });
        },
    });
}