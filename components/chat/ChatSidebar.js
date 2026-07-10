"use client";

import { useMemo, useState } from "react";
import { useConversations } from "../../hooks/useConversations";
import NewChatModal from "./NewChatModal";
import SearchInput from "./SearchInput";
import UserList from "./UserList";
import SidebarSkeleton from "./SidebarSkeleton";
import EmptyState from "./EmptyState";
import LogoutButton from "./LogoutButton";
import ProfileModal from "./ProfileModal";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
export default function ChatSidebar({ selectedChat, setSelectedChat, onlineUsers, currentUser }) {
    const [search, setSearch] = useState("");
    const {
        data: conversations = [],
        isPending,
        error,
    } = useConversations();
    const [profileOpen, setProfileOpen] = useState(false);
    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) =>
            conversation.user.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [conversations, search]);

    return (
        <>

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
                <div className="border-t border-[#E2E8F0] flex justify-between items-center p-4">
                    <button
                        onClick={() => setProfileOpen(true)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 transition hover:bg-[#F8FAFC]"
                    >
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={currentUser?.image || ""} />
                            <AvatarFallback>
                                {currentUser?.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 text-left">
                            <p className="truncate font-medium">
                                {currentUser?.name}
                            </p>

                            <p className="text-xs text-[#64748B]">
                                View Profile
                            </p>
                        </div>
                    </button>
                    <LogoutButton />


                    <ProfileModal
                        open={profileOpen}
                        onOpenChange={setProfileOpen}
                    />
                </div>
            </aside>

        </>
    );
}