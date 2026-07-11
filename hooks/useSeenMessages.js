import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSeenMessages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId }) => {
            const res = await fetch("/api/messages/seen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update seen messages");
            }
            return data;
        },

        onSuccess: (data, variables) => {
            const updatedIds = new Set(data.updatedMessageIds || []);
            if (updatedIds.size === 0) return;

            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (old = []) =>
                    old.map((msg) =>
                        updatedIds.has(msg.id)
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
