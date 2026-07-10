import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversationMember } from "@/db/schema";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

export async function DELETE(req, { params }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const now = new Date();

        const updated = await db
            .update(conversationMember)
            .set({
                deletedAt: now,
                clearedAt: now,
            })
            .where(
                and(
                    eq(conversationMember.conversationId, id),
                    eq(conversationMember.userId, session.user.id)
                )
            )
            .returning();

        if (!updated.length) {
            return Response.json({ error: "Conversation not found" }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.log("DELETE_CHAT_ERROR:", error);

        return Response.json(
            { error: "Failed to delete chat" },
            { status: 500 }
        );
    }
}