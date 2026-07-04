"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function UserCard({ user, selected, onClick, online }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-3 rounded-2xl border border-transparent p-3 text-left transition-all duration-300 ease-in-out",
                "hover:border-[#DBEAFE] hover:bg-[#EFF6FF]",
                selected && "border-[#2563EB] bg-[#EFF6FF]"
            )}
        >
            <div className="relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.user.image || ""} />
                    <AvatarFallback className="bg-[#2563EB] text-white">
                        {user.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-400"
                        }`}
                />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-[#0F172A]">
                        {user.user.name}
                    </h3>

                    {user.lastMessageTime && (
                        <span className="shrink-0 text-xs text-[#94A3B8]">
                            {new Date(user.lastMessageTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                </div>

                <p className="mt-1 truncate text-sm text-[#64748B]">
                    {user.lastMessage}
                </p>
            </div>
        </button>
    );
}