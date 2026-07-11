import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEditMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, text }) => {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to edit message");
            return data;
        },

        onSuccess: (data) => {
            const updated = data.message;

            queryClient.setQueryData(
                ["messages", updated.conversationId],
                (old = []) =>
                    old.map((msg) =>
                        msg.id === updated.id ? { ...msg, ...updated } : msg
                    )
            );

            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
}
