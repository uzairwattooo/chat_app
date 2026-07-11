"use client";

import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/presence", { method: "POST" });
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
            size="icon"
            onClick={handleLogout}
            title="Logout"
            className="h-10 w-10 shrink-0 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
            <LogOut className="h-[18px] w-[18px]" />
        </Button>
    );
}
