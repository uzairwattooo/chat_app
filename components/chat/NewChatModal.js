"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/useUsers";
import { useConversation } from "@/hooks/useConversation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function NewChatModal({ setSelectedChat }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const queryClient = useQueryClient();
    const { data: users = [], isPending } = useUsers();
    const conversationMutation = useConversation();

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleStartChat = (user) => {
        conversationMutation.mutate(user.id, {
            onSuccess: (data) => {
                setSelectedChat({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    lastSeen: user.lastSeen,
                    conversationId: data.conversationId,
                });
                queryClient.invalidateQueries({
                    queryKey: ["conversations"],
                });

                setOpen(false);
                setSearch("");
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8]">
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Start new chat</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="h-11 rounded-xl pl-9"
                    />
                </div>

                <div className="max-h-[360px] space-y-2 overflow-y-auto pt-2">
                    {isPending ? (
                        <p className="py-8 text-center text-sm text-[#64748B]">
                            Loading users...
                        </p>
                    ) : filteredUsers.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[#64748B]">
                            No users found
                        </p>
                    ) : (
                        filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleStartChat(user)}
                                className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[#F8FAFC]"
                            >
                                <Avatar className="h-11 w-11">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className="bg-[#2563EB] text-white">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <h4 className="truncate font-medium text-[#0F172A]">
                                        {user.name}
                                    </h4>
                                    <p className="truncate text-sm text-[#64748B]">
                                        {user.email}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}