"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";

export default function MediaPreviewModal({ media, open, onOpenChange }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!open) videoRef.current?.pause();
    }, [open]);

    if (!media) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl overflow-hidden rounded-[28px] border-white/10 bg-slate-950/95 p-0 text-white shadow-2xl backdrop-blur-2xl">
                <DialogTitle className="sr-only">Media preview</DialogTitle>
                <div className="flex min-h-[72vh] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_55%)] p-4 sm:p-8">
                    {media.type === "image" ? (
                        <div className="relative h-[72vh] w-full overflow-hidden rounded-2xl">
                            <Image src={media.fileUrl} alt={media.fileName || "Image preview"} fill sizes="100vw" className="object-contain" />
                        </div>
                    ) : media.type === "video" ? (
                        <video ref={videoRef} src={media.fileUrl} controls autoPlay className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl" />
                    ) : null}
                </div>
                {media.text && media.text !== media.fileName && (
                    <div className="border-t border-white/10 bg-slate-950/80 px-6 py-4 text-center text-sm font-medium text-slate-200">
                        {media.text}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
