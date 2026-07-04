import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { headers } from "next/headers";
import { ne } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                lastSeen: user.lastSeen,
            })
            .from(user)
            .where(ne(user.id, session.user.id));

        return Response.json({ users });
    } catch (error) {
        console.log("USERS_API_ERROR:", error);

        return Response.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}