"use client";

import { useState } from "react";
import { Plus, Search, MessageSquarePlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/useUsers";
import { useConversation } from "@/hooks/useConversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
                queryClient.invalidateQueries({ queryKey: ["conversations"] });
                setOpen(false);
                setSearch("");
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-blue-500" title="New chat">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-slate-200/80 p-0 shadow-2xl">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-500 px-6 py-6 text-white">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                        <MessageSquarePlus className="h-5 w-5" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold tracking-[-0.02em] text-white">Start a new conversation</DialogTitle>
                    </DialogHeader>
                    <p className="mt-1 text-sm text-indigo-100">Find someone and start chatting instantly.</p>
                </div>

                <div className="p-5">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people" className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10" />
                    </div>

                    <div className="mt-4 max-h-[390px] space-y-2 overflow-y-auto pr-1">
                        {isPending ? (
                            <p className="py-10 text-center text-sm text-slate-400">Loading people…</p>
                        ) : filteredUsers.length === 0 ? (
                            <p className="py-10 text-center text-sm text-slate-400">No users found</p>
                        ) : (
                            filteredUsers.map((user) => (
                                <button key={user.id} onClick={() => handleStartChat(user)} className="flex w-full items-center gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/60">
                                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                                        <AvatarImage src={user.image || ""} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 font-bold text-white">{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-sm font-bold text-slate-900">{user.name}</h4>
                                        <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{user.email}</p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
