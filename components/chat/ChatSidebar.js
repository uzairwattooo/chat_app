"use client";

import { useMemo, useState } from "react";
import { useConversations } from "../../hooks/useConversations";
import NewChatModal from "./NewChatModal";
import SearchInput from "./SearchInput";
import UserList from "./UserList";
import SidebarSkeleton from "./SidebarSkeleton";
import EmptyState from "./EmptyState";
import LogoutButton from "./LogoutButton";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
export default function ChatSidebar({ selectedChat, setSelectedChat, onlineUsers }) {
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel("sidebar-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "message",
                },
                () => {
                    queryClient.invalidateQueries({
                        queryKey: ["conversations"],
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const {
        data: conversations = [],
        isPending,
        error,
    } = useConversations();

    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) =>
            conversation.user.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [conversations, search]);

    return (
        <aside className="flex h-full min-h-0 flex-col border-r border-[#E2E8F0] bg-white">
            <div className="border-b border-[#E2E8F0] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-[#0F172A]">Chats</h2>

                    <NewChatModal setSelectedChat={setSelectedChat} />
                </div>

                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {isPending ? (
                    <SidebarSkeleton />
                ) : error ? (
                    <EmptyState />
                ) : filteredConversations.length === 0 ? (
                    <EmptyState />
                ) : (
                    <UserList
                        users={filteredConversations}
                        selectedChat={selectedChat}
                        setSelectedChat={setSelectedChat}
                        onlineUsers={onlineUsers}
                    />
                )}
            </div>
            <div className="border-t border-[#E2E8F0] p-4">
                <LogoutButton />
            </div>
        </aside>
    );
}