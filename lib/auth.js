import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/lib/db";

export const auth = betterAuth({
    trustedOrigins: ["http://localhost:3000",
        "https://chat-app-seven-iota-47.vercel.app"
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

    emailAndPassword: {
        enabled: true,
    },
});