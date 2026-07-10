import * as tus from "tus-js-client";
import { supabase } from "@/lib/supabase";

export function uploadWithProgress({
    file,
    filePath,
    bucket = "documents",
    onProgress,
}) {
    return new Promise((resolve, reject) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
                const percentage = Math.round(
                    (bytesUploaded / bytesTotal) * 100
                );

                onProgress?.(percentage);
            },

            onError(error) {
                reject(error);
            },

            onSuccess() {
                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                resolve(data.publicUrl);
            },
        });

        upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
            }

            upload.start();
        });
    });
}