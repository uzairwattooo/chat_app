import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, image }) => {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    image,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            return data.user;
        },

        onSuccess: (updatedUser) => {
            queryClient.setQueryData(["profile"], updatedUser);
            queryClient.setQueryData(["me"], updatedUser);

            queryClient.invalidateQueries({
                queryKey: ["conversations"],
            });

            toast.success("Profile updated successfully");
        },

        onError: (error) => {
            toast.error(error.message || "Profile update failed");
        },
    });
}