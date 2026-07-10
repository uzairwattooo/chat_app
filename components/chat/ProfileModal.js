"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

export default function ProfileModal({ open, onOpenChange }) {
    const { data: profile, isPending } = useProfile();
    const updateProfile = useUpdateProfile();

    const [name, setName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!profile) return;

        setName(profile.name || "");
        setImageUrl(profile.image || "");
        setPreviewUrl(profile.image || "");
    }, [profile]);

    const handleImageSelect = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        event.target.value = "";

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Profile image must be less than 5 MB");
            return;
        }

        const temporaryPreview = URL.createObjectURL(file);
        setPreviewUrl(temporaryPreview);

        try {
            setIsUploading(true);

            const safeFileName = file.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

            const filePath = `profiles/${crypto.randomUUID()}-${safeFileName}`;

            const { error } = await supabase.storage
                .from("documents")
                .upload(filePath, file, {
                    cacheControl: "31536000",
                    upsert: false,
                });

            if (error) {
                throw error;
            }

            const { data } = supabase.storage
                .from("documents")
                .getPublicUrl(filePath);

            setImageUrl(data.publicUrl);
            toast.success("Profile image uploaded");
        } catch (error) {
            setPreviewUrl(profile?.image || "");
            toast.error(error.message || "Image upload failed");
        } finally {
            setIsUploading(false);
            URL.revokeObjectURL(temporaryPreview);
        }
    };

    const handleRemoveImage = () => {
        setImageUrl("");
        setPreviewUrl("");
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }

        updateProfile.mutate(
            {
                name: name.trim(),
                image: imageUrl || null,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>

                {isPending ? (
                    <div className="flex min-h-[260px] items-center justify-center">
                        <LoaderCircle className="h-6 w-6 animate-spin text-[#2563EB]" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-col items-center">
                            <div className="group relative">
                                <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                                    <AvatarImage src={previewUrl || ""} />

                                    <AvatarFallback className="bg-[#EAF1FF] text-[#2563EB]">
                                        {name?.charAt(0)?.toUpperCase() || (
                                            <UserRound className="h-9 w-9" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#2563EB] text-white shadow-md transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </button>

                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleImageSelect}
                            />

                            <p className="mt-3 text-xs text-[#64748B]">
                                JPG, PNG or WEBP. Maximum 5 MB.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#0F172A]">
                                Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Enter your name"
                                maxLength={50}
                                className="h-11 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#0F172A]">
                                Email
                            </label>

                            <Input
                                value={profile?.email || ""}
                                disabled
                                className="h-11 rounded-xl bg-[#F8FAFC]"
                            />

                            <p className="text-xs text-[#94A3B8]">
                                Email cannot be changed here.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={isUploading || updateProfile.isPending}
                                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                            >
                                {updateProfile.isPending
                                    ? "Saving..."
                                    : "Save changes"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}