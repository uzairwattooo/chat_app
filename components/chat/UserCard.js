"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function UserCard({ user, selected, onClick, online }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition-all duration-200",
                selected
                    ? "border-indigo-200 bg-gradient-to-r from-indigo-50 to-cyan-50/60 shadow-sm"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
            )}
        >
            <div className="relative shrink-0">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm sm:h-[52px] sm:w-[52px]">
                    <AvatarImage src={user.user.image || ""} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 font-bold text-white">
                        {user.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white ${online ? "bg-emerald-500" : "bg-slate-300"}`} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("truncate text-[14px] font-bold", selected ? "text-indigo-950" : "text-slate-900")}>
                        {user.user.name}
                    </h3>
                    {user.lastMessageTime && (
                        <span className={cn("shrink-0 text-[10px] font-semibold", selected ? "text-indigo-500" : "text-slate-400")}>
                            {new Date(user.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                </div>
                <p className={cn("mt-1 truncate text-xs font-medium", selected ? "text-indigo-600/70" : "text-slate-400")}>
                    {user.lastMessage}
                </p>
            </div>
        </button>
    );
}
