"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Image, X, Send, Smile, Mic, Square, Trash2, } from "lucide-react";
import { useEditMessage } from "@/hooks/useEditMessage";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import { uploadWithProgress } from "@/lib/uploadWithProgress";

export default function MessageInput({ selectedChat,
    currentUser,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    activityChannelRef,
}) {
    const [showEmoji, setShowEmoji] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [text, setText] = useState("");

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const emojiRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const sendMutation = useSendMessage();
    const editMutation = useEditMessage();
    const queryClient = useQueryClient();
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType || "audio/webm",
                });
                const audioFile = new File(
                    [audioBlob],
                    `voice-${Date.now()}.webm`,
                    {
                        type: audioBlob.type,
                    }
                );
                setRecordedAudio({
                    file: audioFile,
                    url: URL.createObjectURL(audioBlob),
                });

                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            activityChannelRef.current?.send({
                type: "broadcast",
                event: "recording",
                payload: {
                    conversationId: selectedChat.conversationId,
                },
            });

            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((previous) => previous + 1);
            }, 1000);
        } catch (error) {
            console.error("RECORDING_ERROR:", error);
            toast.error("Microphone permission is required");
        }
    };

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }

        activityChannelRef.current?.send({
            type: "broadcast",
            event: "stop-recording",
            payload: {
                conversationId: selectedChat.conversationId,
            },
        });

        clearInterval(recordingTimerRef.current);
        setIsRecording(false);
    };

    const cancelRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }
        activityChannelRef.current?.send({
            type: "broadcast",
            event: "stop-recording",
            payload: {
                conversationId: selectedChat.conversationId,
            },
        });
        clearInterval(recordingTimerRef.current);
        if (recordedAudio?.url) {
            URL.revokeObjectURL(recordedAudio.url);
        }
        setIsRecording(false);
        setRecordingTime(0);
        setRecordedAudio(null);
    };
    const sendVoiceMessage = async () => {
        if (!recordedAudio?.file || !selectedChat?.conversationId) return;

        const conversationId = selectedChat.conversationId;
        const messageId = crypto.randomUUID();
        const localUrl = recordedAudio.url;
        const replyToId = replyingTo?.id || null;

        const optimisticMessage = {
            id: messageId,
            conversationId,
            senderId: currentUser?.id,
            text: "Voice message",
            type: "audio",
            fileUrl: localUrl,
            fileName: recordedAudio.file.name,
            mimeType: recordedAudio.file.type,
            fileSize: recordedAudio.file.size,
            replyToId,
            createdAt: new Date().toISOString(),
            seen: false,
            seenAt: null,
            editedAt: null,
            deletedAt: null,
            reactions: [],
            uploading: true,
            uploadProgress: 0,
            sending: false,
            failed: false,
        };

        queryClient.setQueryData(
            ["messages", conversationId],
            (old = []) => [...old, optimisticMessage]
        );

        setRecordedAudio(null);
        setReplyingTo(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const filePath = `${crypto.randomUUID()}-voice.webm`;
            const publicUrl = await uploadWithProgress({
                file: recordedAudio.file,
                filePath,
                bucket: "documents",
                onProgress: (progress) => {
                    setUploadProgress(progress);
                    queryClient.setQueryData(
                        ["messages", conversationId],
                        (old = []) =>
                            old.map((message) =>
                                message.id === messageId
                                    ? { ...message, uploadProgress: progress }
                                    : message
                            )
                    );
                },
            });

            sendMutation.mutate(
                {
                    messageId,
                    conversationId,
                    currentUserId: currentUser?.id,
                    text: "Voice message",
                    type: "audio",
                    fileUrl: publicUrl,
                    fileName: recordedAudio.file.name,
                    mimeType: recordedAudio.file.type,
                    fileSize: recordedAudio.file.size,
                    replyToId,
                    skipOptimistic: true,
                },
                {
                    onSuccess: () => {
                        if (localUrl?.startsWith("blob:")) {
                            URL.revokeObjectURL(localUrl);
                        }
                        setRecordingTime(0);
                        setUploadProgress(0);
                        setIsUploading(false);
                    },
                    onError: () => {
                        queryClient.setQueryData(
                            ["messages", conversationId],
                            (old = []) =>
                                old.map((message) =>
                                    message.id === messageId
                                        ? {
                                            ...message,
                                            uploading: false,
                                            sending: false,
                                            failed: true,
                                        }
                                        : message
                                )
                        );
                        setIsUploading(false);
                        toast.error("Voice message send nahi hua");
                    },
                }
            );
        } catch (error) {
            queryClient.setQueryData(
                ["messages", conversationId],
                (old = []) =>
                    old.map((message) =>
                        message.id === messageId
                            ? {
                                ...message,
                                uploading: false,
                                sending: false,
                                failed: true,
                            }
                            : message
                    )
            );
            setIsUploading(false);
            toast.error(error.message || "Voice upload failed");
        }
    };
    const formatRecordingTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setCaption("");
        if (
            file.type.startsWith("image") ||
            file.type.startsWith("video")
        ) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl("");
        }

        e.target.value = "";
    };
    const handleUploadAndSend = async () => {
        if (!selectedFile || !selectedChat?.conversationId) return;

        if (selectedFile.size > 25 * 1024 * 1024) {
            toast.error("File size must be less than 25 MB");
            return;
        }

        const file = selectedFile;
        const conversationId = selectedChat.conversationId;
        const messageId = crypto.randomUUID();
        const replyToId = replyingTo?.id || null;
        const messageType = file.type.startsWith("image")
            ? "image"
            : file.type.startsWith("video")
                ? "video"
                : file.type.startsWith("audio")
                    ? "audio"
                    : "file";

        const localFileUrl = previewUrl || URL.createObjectURL(file);
        const optimisticMessage = {
            id: messageId,
            conversationId,
            senderId: currentUser?.id,
            text: caption.trim() || file.name,
            type: messageType,
            fileUrl: localFileUrl,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            replyToId,
            createdAt: new Date().toISOString(),
            seen: false,
            seenAt: null,
            editedAt: null,
            deletedAt: null,
            reactions: [],
            uploading: true,
            uploadProgress: 0,
            sending: false,
            failed: false,
        };

        queryClient.setQueryData(
            ["messages", conversationId],
            (old = []) => [...old, optimisticMessage]
        );

        setSelectedFile(null);
        setPreviewUrl("");
        setCaption("");
        setReplyingTo(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const filePath = `${crypto.randomUUID()}-${safeName}`;
            const publicUrl = await uploadWithProgress({
                file,
                filePath,
                bucket: "documents",
                onProgress: (progress) => {
                    setUploadProgress(progress);
                    queryClient.setQueryData(
                        ["messages", conversationId],
                        (old = []) =>
                            old.map((message) =>
                                message.id === messageId
                                    ? { ...message, uploadProgress: progress }
                                    : message
                            )
                    );
                },
            });

            sendMutation.mutate(
                {
                    messageId,
                    conversationId,
                    currentUserId: currentUser?.id,
                    text: optimisticMessage.text,
                    type: messageType,
                    fileUrl: publicUrl,
                    fileName: file.name,
                    mimeType: file.type,
                    fileSize: file.size,
                    replyToId,
                    skipOptimistic: true,
                },
                {
                    onSuccess: () => {
                        if (localFileUrl.startsWith("blob:")) {
                            URL.revokeObjectURL(localFileUrl);
                        }
                        setIsUploading(false);
                        setUploadProgress(0);
                    },
                    onError: (error) => {
                        queryClient.setQueryData(
                            ["messages", conversationId],
                            (old = []) =>
                                old.map((message) =>
                                    message.id === messageId
                                        ? {
                                            ...message,
                                            uploading: false,
                                            sending: false,
                                            failed: true,
                                        }
                                        : message
                                )
                        );
                        setIsUploading(false);
                        toast.error(error.message || "Message save failed");
                    },
                }
            );
        } catch (error) {
            queryClient.setQueryData(
                ["messages", conversationId],
                (old = []) =>
                    old.map((message) =>
                        message.id === messageId
                            ? {
                                ...message,
                                uploading: false,
                                sending: false,
                                failed: true,
                            }
                            : message
                    )
            );
            setIsUploading(false);
            setUploadProgress(0);
            toast.error(error.message || "Upload failed");
        }
    };
    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.text);
        } else {
            setText("");
        }
    }, [editingMessage]);
    useEffect(() => {
        setText("");
    }, [selectedChat?.conversationId]);
    const handleSend = () => {
        if (!text.trim() || !selectedChat?.conversationId) return;

        const messageText = text.trim();

        if (editingMessage) {
            editMutation.mutate(
                { messageId: editingMessage.id, text: messageText },
                {
                    onSuccess: () => {
                        setText("");
                        setEditingMessage(null);
                        setReplyingTo(null);
                    },
                }
            );
            return;
        }

        const messageId = crypto.randomUUID();
        setText("");

        sendMutation.mutate(
            {
                messageId,
                conversationId: selectedChat.conversationId,
                currentUserId: currentUser?.id,
                text: messageText,
                replyToId: replyingTo?.id || null,
            },
            {
                onSuccess: () => setReplyingTo(null),
                onError: () => setText(messageText),
            }
        );
    };
    useEffect(() => {
        const handleClick = (e) => {
            if (
                emojiRef.current &&
                !emojiRef.current.contains(e.target)
            ) {
                setShowEmoji(false);
            }
        };

        document.addEventListener("mousedown", handleClick);

        return () =>
            document.removeEventListener("mousedown", handleClick);
    }, []);
    const fileInputRef = useRef(null);

    return (
        <div className="relative shrink-0 border-t border-slate-200/70 bg-white/90 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
            {editingMessage && (
                <div className="mx-auto mb-3 flex max-w-5xl items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 shadow-sm">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">
                            Editing message
                        </p>
                        <p className="mt-0.5 max-w-[320px] truncate text-sm font-medium text-slate-500">
                            {editingMessage.text}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingMessage(null);
                            setText("");
                        }}
                        className="rounded-full p-1 hover:bg-white"
                    >
                        <X className="h-4 w-4 text-[#64748B]" />
                    </button>
                </div>
            )}

            {selectedFile && (
                <div className="mx-auto mb-3 max-w-5xl rounded-[24px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/40 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            {selectedFile.type.startsWith("image") && previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-h-64 w-full rounded-2xl bg-slate-950/5 object-contain"
                                />
                            ) : selectedFile.type.startsWith("video") && previewUrl ? (
                                <video
                                    src={previewUrl}
                                    controls
                                    className="max-h-64 w-full rounded-2xl bg-slate-950"
                                />
                            ) : (
                                <p className="truncate text-sm font-medium text-[#0F172A]">
                                    {selectedFile.name}
                                </p>
                            )}

                            <Input
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="mt-3 h-11 rounded-xl border-slate-200 bg-slate-50/80"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                setSelectedFile(null);
                                setPreviewUrl("");
                                setCaption("");
                            }}
                            className="rounded-full p-1 hover:bg-white"
                        >
                            <X className="h-4 w-4 text-[#64748B]" />
                        </button>
                    </div>

                    {isUploading && (
                        <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-[#64748B]">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-[width] duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <Button
                        type="button"
                        onClick={handleUploadAndSend}
                        disabled={isUploading}
                        className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-blue-500"
                    >
                        {isUploading
                            ? `Uploading ${uploadProgress}%`
                            : "Send file"}
                    </Button>
                </div>
            )}

            {showEmoji && (
                <div
                    ref={emojiRef}
                    className="absolute bottom-20 left-3 z-50 overflow-hidden rounded-2xl shadow-2xl sm:left-5"
                >
                    <EmojiPicker
                        onEmojiClick={(emojiData) => {
                            setText((prev) => prev + emojiData.emoji);
                            setShowEmoji(false);
                        }}
                    />
                </div>
            )}
            {isRecording ? (
                <div className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

                    <p className="flex-1 text-sm font-medium text-red-600">
                        Recording {formatRecordingTime(recordingTime)}
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={cancelRecording}
                    >
                        <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>

                    <Button
                        type="button"
                        size="icon"
                        onClick={stopRecording}
                        className="rounded-full bg-red-500 hover:bg-red-600"
                    >
                        <Square className="h-4 w-4 fill-white text-white" />
                    </Button>
                </div>
            ) : recordedAudio ? (
                <div className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-2.5 shadow-sm">
                    <audio
                        src={recordedAudio.url}
                        controls
                        className="min-w-0 flex-1"
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={cancelRecording}
                    >
                        <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>

                    <Button
                        type="button"
                        size="icon"
                        disabled={isUploading}
                        onClick={sendVoiceMessage}
                        className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-blue-500"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            ) : (
                <div className="mx-auto flex max-w-5xl items-center gap-1.5 rounded-[24px] border border-slate-200 bg-slate-50/90 p-1.5 shadow-inner shadow-slate-100 sm:gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowEmoji((prev) => !prev)}
                    >
                        <Smile className="size-5 text-slate-500" />
                    </Button>

                    <input
                        type="file"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Image className="size-5 text-slate-500" />
                    </Button>
                    {replyingTo && (
                        <div className="mb-3 flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">
                                    Replying to message
                                </p>

                                <p className="max-w-[300px] truncate text-sm text-[#64748B]">
                                    {replyingTo.type === "text"
                                        ? replyingTo.text
                                        : replyingTo.type === "image"
                                            ? "📷 Image"
                                            : replyingTo.type === "video"
                                                ? "🎥 Video"
                                                : replyingTo.type === "audio"
                                                    ? "🎤 Voice message"
                                                    : "📄 Document"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="rounded-full p-1 hover:bg-white"
                            >
                                <X className="h-4 w-4 text-[#64748B]" />
                            </button>
                        </div>
                    )}
                    <Input
                        value={text}
                        onChange={(e) => {
                            const value = e.target.value;
                            setText(value);

                            activityChannelRef.current?.send({
                                type: "broadcast",
                                event: value.trim() ? "typing" : "stop-typing",
                                payload: {
                                    conversationId: selectedChat.conversationId,
                                },
                            });

                            clearTimeout(typingTimeoutRef.current);

                            typingTimeoutRef.current = setTimeout(() => {
                                activityChannelRef.current?.send({
                                    type: "broadcast",
                                    event: "stop-typing",
                                    payload: {
                                        conversationId: selectedChat.conversationId,
                                    },
                                });
                            }, 1000);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                        className="h-11 flex-1 border-0 bg-transparent px-2 text-[15px] font-medium text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                    />

                    <Button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-blue-500"
                    >
                        <Send className="size-5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={startRecording}
                    >
                        <Mic className="h-5 w-5 text-slate-500" />
                    </Button>
                </div>
            )}

        </div>
    );
}