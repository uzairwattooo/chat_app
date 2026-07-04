import { useQuery } from "@tanstack/react-query";

export function useConversations() {
    return useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const res = await fetch("/api/conversations");

            if (!res.ok) {
                throw new Error("Failed to fetch conversations");
            }

            const data = await res.json();
            return data.conversations;
        },
        refetchOnWindowFocus: true,
    });
}