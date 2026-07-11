"use client";

import UserCard from "./UserCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserList({ users, selectedChat, setSelectedChat, onlineUsers }) {
    return (
        <div className="space-y-2 transition-all duration-300">
            {users.map((conversation) => {
                const isSelected =
                    selectedChat?.conversationId === conversation.conversationId;

                const isOnline = onlineUsers?.includes(conversation.user.id);

                const hasUnread =
                    Number(conversation.unreadCount || 0) > 0;

                return (
                    <button
                        key={conversation.conversationId}
                        type="button"
                        onClick={() =>
                            setSelectedChat({
                                id: conversation.user.id,
                                name: conversation.user.name,
                                email: conversation.user.email,
                                image: conversation.user.image,
                                lastSeen: conversation.user.lastSeen,
                                conversationId: conversation.conversationId,
                            })
                        }
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${isSelected
                                ? "bg-indigo-50 ring-1 ring-indigo-100"
                                : "hover:bg-slate-50"
                            }`}
                    >
                        <div className="relative shrink-0">
                            <Avatar className="h-12 w-12">
                                {conversation.user.image ? (
                                    <AvatarImage
                                        src={conversation.user.image}
                                        alt={conversation.user.name}
                                        className="object-cover"
                                    />
                                ) : null}

                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 font-bold text-white">
                                    {conversation.user.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>

                            {isOnline && (
                                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <p
                                    className={`truncate text-sm ${hasUnread
                                            ? "font-extrabold text-slate-950"
                                            : "font-bold text-slate-800"
                                        }`}
                                >
                                    {conversation.user.name}
                                </p>

                                <span
                                    className={`shrink-0 text-[11px] ${hasUnread
                                            ? "font-bold text-red-500"
                                            : "font-medium text-slate-400"
                                        }`}
                                >
                                    {conversation.lastMessageTime
                                        ? new Date(
                                            conversation.lastMessageTime
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : ""}
                                </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-3">
                                <p
                                    className={`truncate text-xs ${hasUnread
                                            ? "font-semibold text-slate-700"
                                            : "font-medium text-slate-400"
                                        }`}
                                >
                                    {conversation.lastMessage || "No messages yet"}
                                </p>

                                {hasUnread && (
                                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm shadow-red-500/20">
                                        {conversation.unreadCount > 99
                                            ? "99+"
                                            : conversation.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}