import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchInput({ value, onChange }) {
    return (
        <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
            <Input
                value={value}
                onChange={onChange}
                placeholder="Search conversations"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-10 pr-11 text-sm font-medium text-slate-800 shadow-inner shadow-slate-100 placeholder:text-slate-400 focus-visible:border-indigo-300 focus-visible:ring-indigo-200"
            />
            <div className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400">
                <SlidersHorizontal className="h-4 w-4" />
            </div>
        </div>
    );
}
