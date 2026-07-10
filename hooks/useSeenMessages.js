import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSeenMessages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId }) => {
            const res = await fetch("/api/messages/seen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ conversationId }),
            });

            if (!res.ok) {
                throw new Error("Failed to update seen messages");
            }

            return res.json();
        },

        onSuccess: (_, variables) => {
            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) =>
                    old.map((msg) =>
                        msg.senderId !== variables.currentUserId
                            ? {
                                ...msg,
                                seen: true,
                                seenAt: msg.seenAt || new Date().toISOString(),
                            }
                            : msg
                    )
            );
        },
    });
}