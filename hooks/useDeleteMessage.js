import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId }) => {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete message");
            return data;
        },

        onSuccess: (data) => {
            const deleted = data.message;

            queryClient.setQueryData(
                ["messages", deleted.conversationId],
                (old = []) => old.filter((msg) => msg.id !== deleted.id)
            );

            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
}
