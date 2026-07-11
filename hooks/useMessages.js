import { useQuery } from "@tanstack/react-query";

export function useMessages(conversationId) {
    return useQuery({
        queryKey: ["messages", conversationId],
        enabled: Boolean(conversationId),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const res = await fetch(
                `/api/messages?conversationId=${encodeURIComponent(conversationId)}`
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
            return data.messages;
        },
    });
}
