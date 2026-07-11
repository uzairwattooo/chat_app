"use client";

import { useMemo, useState } from "react";
import { MessageCircleMore, ChevronRight } from "lucide-react";
import { useConversations } from "../../hooks/useConversations";
import NewChatModal from "./NewChatModal";
import SearchInput from "./SearchInput";
import UserList from "./UserList";
import SidebarSkeleton from "./SidebarSkeleton";
import EmptyState from "./EmptyState";
import LogoutButton from "./LogoutButton";
import ProfileModal from "./ProfileModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatSidebar({ selectedChat, setSelectedChat, onlineUsers, currentUser }) {
    const [search, setSearch] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);
    const { data: conversations = [], isPending, error } = useConversations();

    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) =>
            conversation.user.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [conversations, search]);

    return (
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-200/70 bg-white/95 backdrop-blur-xl">
            <div className="shrink-0 border-b border-slate-200/70 px-4 pb-4 pt-5 sm:px-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
                            <MessageCircleMore className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-[-0.03em] text-slate-950">Messages</h1>
                            <p className="text-xs font-medium text-slate-400">Stay close, instantly.</p>
                        </div>
                    </div>
                    <NewChatModal setSelectedChat={setSelectedChat} />
                </div>

                <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
                <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Recent chats</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{filteredConversations.length}</span>
                </div>
                {isPending ? (
                    <SidebarSkeleton />
                ) : error || filteredConversations.length === 0 ? (
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

            <div className="shrink-0 border-t border-slate-200/70 bg-slate-50/70 p-3 sm:p-4">
                <div className="flex items-center gap-2 rounded-[22px] border border-slate-200/70 bg-white p-2 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setProfileOpen(true)}
                        className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1.5 text-left transition hover:bg-slate-50"
                    >
                        <Avatar className="h-11 w-11 ring-2 ring-indigo-100">
                            <AvatarImage src={currentUser?.image || ""} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 font-bold text-white">
                                {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">{currentUser?.name || "Your profile"}</p>
                            <p className="truncate text-xs font-medium text-slate-400">Manage profile</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                    </button>
                    <LogoutButton />
                </div>
            </div>

            <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
        </aside>
    );
}
