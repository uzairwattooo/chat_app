import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMessageReaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, emoji }) => {
            const res = await fetch(`/api/messages/${messageId}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emoji }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to react");
            return data;
        },

        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: ["messages", variables.conversationId],
            });

            const previousMessages =
                queryClient.getQueryData(["messages", variables.conversationId]) || [];

            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) =>
                    old.map((msg) => {
                        if (msg.id !== variables.messageId) return msg;

                        const reactions = msg.reactions || [];
                        const mine = reactions.find(
                            (reaction) => reaction.userId === variables.currentUserId
                        );

                        if (mine?.emoji === variables.emoji) {
                            return {
                                ...msg,
                                reactions: reactions.filter(
                                    (reaction) =>
                                        reaction.userId !== variables.currentUserId
                                ),
                            };
                        }

                        const withoutMine = reactions.filter(
                            (reaction) =>
                                reaction.userId !== variables.currentUserId
                        );

                        return {
                            ...msg,
                            reactions: [
                                ...withoutMine,
                                {
                                    id: mine?.id || `temp-reaction-${crypto.randomUUID()}`,
                                    userId: variables.currentUserId,
                                    emoji: variables.emoji,
                                },
                            ],
                        };
                    })
            );

            return { previousMessages };
        },

        onSuccess: (data, variables) => {
            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) =>
                    old.map((msg) => {
                        if (msg.id !== variables.messageId) return msg;

                        const withoutMine = (msg.reactions || []).filter(
                            (reaction) =>
                                reaction.userId !== variables.currentUserId
                        );

                        return {
                            ...msg,
                            reactions: data.reaction
                                ? [...withoutMine, data.reaction]
                                : withoutMine,
                        };
                    })
            );
        },

        onError: (_error, variables, context) => {
            queryClient.setQueryData(
                ["messages", variables.conversationId],
                context?.previousMessages || []
            );
        },
    });
}
