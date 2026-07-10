"use client";

import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/presence", {
            method: "POST",
        });
        const { error } = await authClient.signOut();

        if (error) {
            toast.error(error.message || "Logout failed");
            return;
        }

        toast.success("Logged out successfully");

        router.replace("/login");
        router.refresh();
    };

    return (
        <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-25 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-600"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
    );
}