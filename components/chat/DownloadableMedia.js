"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
    Download,
    LoaderCircle,
    Play,
    Music,
} from "lucide-react";
import { toast } from "sonner";

const MEDIA_CACHE = "chat-media-v1";

export default function DownloadableMedia({
    message,
    isMe,
    onPreview,
}) {
    const [localUrl, setLocalUrl] = useState("");
    const [isDownloaded, setIsDownloaded] = useState(isMe);
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    const loadFromCache = useCallback(async () => {
        if (!message?.fileUrl) return;

        // Sender apni uploaded media direct remote URL se dekhega.
        if (isMe) {
            setLocalUrl(message.fileUrl);
            setIsDownloaded(true);
            return;
        }

        try {
            const cache = await caches.open(MEDIA_CACHE);
            const cachedResponse = await cache.match(message.fileUrl);

            if (!cachedResponse) {
                setLocalUrl("");
                setIsDownloaded(false);
                return;
            }

            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);

            setLocalUrl(objectUrl);
            setIsDownloaded(true);
            setProgress(100);
        } catch (error) {
            console.error("CACHE_READ_ERROR:", error);
            setIsDownloaded(false);
        }
    }, [isMe, message?.fileUrl]);

    useEffect(() => {
        loadFromCache();

        return () => {
            if (localUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(localUrl);
            }
        };
    }, [loadFromCache]);

    const downloadMedia = async () => {
        if (!message?.fileUrl || isDownloading) return;

        try {
            setIsDownloading(true);
            setProgress(0);

            const response = await fetch(message.fileUrl, {
                cache: "no-store",
            });

            if (!response.ok || !response.body) {
                throw new Error("Media download failed");
            }

            const contentLength = Number(
                response.headers.get("content-length")
            );

            const reader = response.body.getReader();
            const chunks = [];

            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                receivedLength += value.byteLength;

                if (contentLength > 0) {
                    setProgress(
                        Math.min(
                            100,
                            Math.round(
                                (receivedLength / contentLength) * 100
                            )
                        )
                    );
                }
            }

            const blob = new Blob(chunks, {
                type:
                    message.mimeType ||
                    response.headers.get("content-type") ||
                    "application/octet-stream",
            });

            /*
             * Cache me response save kar rahe hain.
             * Refresh ke baad isi cache se media load hogi.
             */
            const cache = await caches.open(MEDIA_CACHE);

            await cache.put(
                message.fileUrl,
                new Response(blob, {
                    headers: {
                        "Content-Type":
                            blob.type || "application/octet-stream",
                        "Content-Length": String(blob.size),
                    },
                })
            );

            const objectUrl = URL.createObjectURL(blob);

            if (localUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(localUrl);
            }

            setLocalUrl(objectUrl);
            setProgress(100);
            setIsDownloaded(true);
            toast.success("Media downloaded");
        } catch (error) {
            console.error("MEDIA_DOWNLOAD_ERROR:", error);
            setProgress(0);
            toast.error(error.message || "Download failed");
        } finally {
            setIsDownloading(false);
        }
    };

    /*
     * Receiver ne abhi media download nahi ki:
     * blurred preview + disabled overlay show hoga.
     */
    if (!isDownloaded && !isMe) {
        return (
            <div className="relative min-h-[190px] min-w-[240px] overflow-hidden rounded-xl bg-[#CBD5E1]">
                {message.type === "image" && (
                    <Image
                        src={message.fileUrl}
                        alt=""
                        fill
                        sizes="320px"
                        className="scale-110 object-cover blur-xl"
                    />
                )}

                {message.type === "video" && (
                    <video
                        src={message.fileUrl}
                        preload="metadata"
                        muted
                        className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                    />
                )}

                {message.type === "audio" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Music className="h-14 w-14 text-[#64748B]" />
                    </div>
                )}

                <div className="absolute inset-0 bg-black/45" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
                    <button
                        type="button"
                        onClick={downloadMedia}
                        disabled={isDownloading}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-black/65 backdrop-blur-sm transition hover:bg-black/80 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <LoaderCircle className="h-7 w-7 animate-spin" />
                        ) : (
                            <Download className="h-7 w-7" />
                        )}
                    </button>

                    <p className="mt-3 max-w-[200px] truncate text-sm font-medium">
                        {message.fileName || "Media"}
                    </p>

                    <p className="mt-1 text-xs text-white/75">
                        {message.fileSize
                            ? `${(
                                message.fileSize /
                                1024 /
                                1024
                            ).toFixed(2)} MB`
                            : ""}
                    </p>

                    {isDownloading && (
                        <div className="mt-4 w-full max-w-[210px]">
                            <div className="mb-1 flex justify-between text-xs">
                                <span>Downloading</span>
                                <span>{progress}%</span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/30">
                                <div
                                    className="h-full rounded-full bg-white transition-[width] duration-150"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (message.type === "image") {
        return (
            <button
                type="button"
                onClick={() =>
                    onPreview?.({
                        ...message,
                        fileUrl: localUrl || message.fileUrl,
                    })
                }
                className="block overflow-hidden rounded-xl"
            >
                <Image
                    src={localUrl || message.fileUrl}
                    alt={message.fileName || "Shared image"}
                    width={320}
                    height={320}
                    unoptimized={localUrl?.startsWith("blob:")}
                    className="max-h-64 w-full rounded-xl object-cover"
                />
            </button>
        );
    }

    if (message.type === "video") {
        return (
            <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                    src={localUrl || message.fileUrl}
                    controls
                    preload="metadata"
                    className="max-h-64 w-full rounded-xl"
                />

                <button
                    type="button"
                    onClick={() =>
                        onPreview?.({
                            ...message,
                            fileUrl: localUrl || message.fileUrl,
                        })
                    }
                    className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
                >
                    <Play className="h-3.5 w-3.5" />
                    Full screen
                </button>
            </div>
        );
    }

    if (message.type === "audio") {
        return (
            <div className="min-w-[240px] rounded-xl bg-white p-3 text-[#0F172A]">
                <div className="mb-2 flex items-center gap-2">
                    <Music className="h-5 w-5 text-[#2563EB]" />

                    <p className="max-w-[190px] truncate text-sm font-medium">
                        {message.fileName || "Audio"}
                    </p>
                </div>

                <audio
                    src={localUrl || message.fileUrl}
                    controls
                    preload="metadata"
                    className="w-full"
                />
            </div>
        );
    }

    return null;
}