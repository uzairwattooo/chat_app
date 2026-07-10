"use client";

import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useRef } from "react";

export default function MediaPreviewModal({
    media,
    open,
    onOpenChange,
}) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!open) {
            videoRef.current?.pause();
        }
    }, [open]);
    if (!media) return null;


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl border-none text-black p-4 bg-white">
                <DialogTitle className="sr-only text-black">
                    Media preview
                </DialogTitle>
                <div className="flex min-h-[70vh] items-center justify-center">
                    {media.type === "image" ? (
                        <div className="relative h-[75vh] w-full">
                            <Image
                                src={media.fileUrl}
                                alt={media.fileName || "Image preview"}
                                fill
                                sizes="100vw"
                                className="object-contain"
                            />
                        </div>
                    ) : media.type === "video" ? (
                        <video
                            ref={videoRef}
                            src={media.fileUrl}
                            controls
                            autoPlay
                            className="max-h-[75vh] max-w-full rounded-xl"
                        />
                    ) : null}
                </div>

                {media.text && media.text !== media.fileName && (
                    <p className="text-center text-sm text-black/80">
                        {media.text}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}