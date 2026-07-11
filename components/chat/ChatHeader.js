import { ArrowLeft, Phone, Video, MoreVertical, Trash2, Eraser } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useClearChat } from "@/hooks/useClearChat";
import { useDeleteChat } from "@/hooks/useDeleteChat";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatHeader({ chat, isTyping, onBack, onlineUsers, onDeleteChat }) {
    const clearChat = useClearChat();
    const deleteChat = useDeleteChat();
    const isOnline = onlineUsers?.includes(chat?.id);

    return (
        <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/90 px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
                    onClick={onBack}
                >
                    <ArrowLeft className="size-5" />
                </Button>

                <div className="relative shrink-0">
                    <Avatar className="h-11 w-11 ring-2 ring-white shadow-md sm:h-12 sm:w-12">
                        <AvatarImage src={chat?.image || ""} alt={chat?.name || "User"} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 font-semibold text-white">
                            {chat?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>

                <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-bold tracking-[-0.01em] text-slate-900 sm:text-base">
                        {chat?.name || "User"}
                    </h2>
                    <p className={`mt-0.5 truncate text-xs font-medium ${isTyping ? "text-indigo-600" : isOnline ? "text-emerald-600" : "text-slate-400"}`}>
                        {isTyping === "recording"
                            ? "Recording a voice message…"
                            : isTyping === "typing"
                                ? "Typing…"
                                : isOnline
                                    ? "Online"
                                    : chat?.lastSeen
                                        ? `Last seen ${new Date(chat.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                        : "Offline"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="hidden h-10 w-10 rounded-2xl text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 sm:inline-flex">
                    <Phone className="size-[18px]" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden h-10 w-10 rounded-2xl text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 sm:inline-flex">
                    <Video className="size-[19px]" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                            <MoreVertical className="size-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-200/80 p-2 shadow-xl">
                        <DropdownMenuItem onClick={() => clearChat.mutate(chat.conversationId)} className="rounded-xl py-2.5 text-slate-700 focus:bg-slate-100">
                            <Eraser className="mr-2 h-4 w-4" />
                            Clear chat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="rounded-xl py-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                            onClick={() => {
                                deleteChat.mutate(chat.conversationId, {
                                    onSuccess: () => onDeleteChat?.(),
                                });
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete chat
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
