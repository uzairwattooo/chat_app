import { useQuery } from "@tanstack/react-query";

export function useProfile() {
    return useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/profile");

            if (!res.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await res.json();
            return data.user;
        },
    });
}