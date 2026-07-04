import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function POST() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
        .update(user)
        .set({
            lastSeen: new Date(),
        })
        .where(eq(user.id, session.user.id));

    return Response.json({ success: true });
}