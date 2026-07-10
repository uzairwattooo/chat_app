import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteChat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (conversationId) => {
            const res = await fetch(
                `/api/conversations/${conversationId}/delete`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                throw new Error("Failed to delete chat");
            }

            return res.json();
        },

        onSuccess: (_, conversationId) => {
            queryClient.removeQueries({
                queryKey: ["messages", conversationId],
            });

            queryClient.invalidateQueries({
                queryKey: ["conversations"],
            });
        },
    });
}