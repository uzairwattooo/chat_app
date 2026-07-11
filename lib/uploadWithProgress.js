import * as tus from "tus-js-client";
import { supabase } from "@/lib/supabase";

const TUS_THRESHOLD = 6 * 1024 * 1024;

function getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (!data?.publicUrl) {
        throw new Error("Public URL was not generated");
    }

    return data.publicUrl;
}

async function uploadSmallFile({ file, filePath, bucket, onProgress }) {
    onProgress?.(0);

    const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type || "application/octet-stream",
        });

    if (error) throw error;

    onProgress?.(100);
    return getPublicUrl(bucket, filePath);
}

function uploadLargeFile({ file, filePath, bucket, onProgress }) {
    return new Promise((resolve, reject) => {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !anonKey) {
                reject(new Error("Supabase environment variables are missing"));
                return;
            }

            const projectId = new URL(supabaseUrl).hostname.split(".")[0];

            const upload = new tus.Upload(file, {
                endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000],
                headers: {
                    authorization: `Bearer ${anonKey}`,
                    apikey: anonKey,
                    "x-upsert": "false",
                },
                metadata: {
                    bucketName: bucket,
                    objectName: filePath,
                    contentType: file.type || "application/octet-stream",
                    cacheControl: "31536000",
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true,
                chunkSize: 6 * 1024 * 1024,
                onProgress(bytesUploaded, bytesTotal) {
                    const percentage = Math.min(
                        100,
                        Math.round((bytesUploaded / bytesTotal) * 100)
                    );
                    onProgress?.(percentage);
                },
                onError: reject,
                onSuccess() {
                    try {
                        onProgress?.(100);
                        resolve(getPublicUrl(bucket, filePath));
                    } catch (error) {
                        reject(error);
                    }
                },
            });

            upload
                .findPreviousUploads()
                .then((previousUploads) => {
                    if (previousUploads.length > 0) {
                        upload.resumeFromPreviousUpload(previousUploads[0]);
                    }
                    upload.start();
                })
                .catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

export function uploadWithProgress({
    file,
    filePath,
    bucket = "documents",
    onProgress,
}) {
    if (!file) {
        return Promise.reject(new Error("File is required"));
    }

    if (file.size < TUS_THRESHOLD) {
        return uploadSmallFile({ file, filePath, bucket, onProgress });
    }

    return uploadLargeFile({ file, filePath, bucket, onProgress });
}
