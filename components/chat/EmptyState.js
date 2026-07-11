import { MessageCircleDashed } from "lucide-react";

export default function EmptyState() {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-500 ring-1 ring-indigo-100">
                <MessageCircleDashed className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No conversations found</h3>
            <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">Start a new conversation or try a different search.</p>
        </div>
    );
}
