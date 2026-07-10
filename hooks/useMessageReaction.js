import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMessageReaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            messageId,
            conversationId,
            emoji,
        }) => {
            const res = await fetch(
                `/api/messages/${messageId}/reaction`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ emoji }),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to react");
            }

            return res.json();
        },

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["messages", variables.conversationId],
            });
        },
    });
}