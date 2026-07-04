import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ChatHeader({ chat, isTyping, onBack, onlineUsers }) {
    const isOnline = onlineUsers?.includes(chat?.id);
    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onBack}
                >
                    <ArrowLeft className="size-5" />
                </Button>

                <Avatar>
                    <AvatarFallback>{chat?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>

                <div>
                    <h2 className="font-semibold">{chat?.name || "User"}</h2>
                    <p className={`text-xs ${isOnline ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                        {isTyping
                            ? "typing..."
                            : isOnline
                                ? "Online"
                                : chat?.lastSeen
                                    ? `Last seen ${new Date(chat.lastSeen).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}`
                                    : "Offline"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                    <Phone className="size-5" />
                </Button>

                <Button variant="ghost" size="icon">
                    <Video className="size-5" />
                </Button>

                <Button variant="ghost" size="icon">
                    <MoreVertical className="size-5" />
                </Button>
            </div>
        </header>
    );
}