import * as tus from "tus-js-client";
import { supabase } from "@/lib/supabase";

const waitUntilFileIsAvailable = async (
    publicUrl,
    maxAttempts = 10
) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(publicUrl, {
                method: "HEAD",
                cache: "no-store",
            });

            if (response.ok) {
                return true;
            }
        } catch (error) {
            console.log(
                `FILE_CHECK_ATTEMPT_${attempt}:`,
                error
            );
        }

        await new Promise((resolve) =>
            setTimeout(resolve, 500)
        );
    }

    throw new Error(
        "File uploaded but is not available yet"
    );
};

export function uploadWithProgress({
    file,
    filePath,
    bucket = "documents",
    onProgress,
}) {
    return new Promise((resolve, reject) => {
        try {
            const supabaseUrl =
                process.env.NEXT_PUBLIC_SUPABASE_URL;

            const anonKey =
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !anonKey) {
                reject(
                    new Error(
                        "Supabase environment variables are missing"
                    )
                );
                return;
            }

            const projectId = new URL(
                supabaseUrl
            ).hostname.split(".")[0];

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
                    contentType:
                        file.type || "application/octet-stream",
                    cacheControl: "31536000",
                },

                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true,
                chunkSize: 6 * 1024 * 1024,

                onProgress(bytesUploaded, bytesTotal) {
                    const percentage = Math.min(
                        100,
                        Math.round(
                            (bytesUploaded / bytesTotal) * 100
                        )
                    );

                    onProgress?.(percentage);
                },

                onError(error) {
                    reject(error);
                },

                async onSuccess() {
                    try {
                        const { data } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(filePath);

                        const publicUrl = data?.publicUrl;

                        if (!publicUrl) {
                            throw new Error(
                                "Public URL was not generated"
                            );
                        }

                        /*
                         * Message DB me tabhi save hoga jab
                         * uploaded file public URL par available ho.
                         */
                        await waitUntilFileIsAvailable(publicUrl);

                        onProgress?.(100);
                        resolve(publicUrl);
                    } catch (error) {
                        reject(error);
                    }
                },
            });

            upload
                .findPreviousUploads()
                .then((previousUploads) => {
                    if (previousUploads.length > 0) {
                        upload.resumeFromPreviousUpload(
                            previousUploads[0]
                        );
                    }

                    upload.start();
                })
                .catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}