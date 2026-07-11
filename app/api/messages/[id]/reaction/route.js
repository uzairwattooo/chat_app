import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
    message,
    messageReaction,
    conversationMember,
} from "@/db/schema";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

export async function POST(req, { params }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: messageId } = await params;
        const { emoji } = await req.json();

        if (!emoji?.trim()) {
            return Response.json(
                { error: "Emoji is required" },
                { status: 400 }
            );
        }

        const targetMessage = await db
            .select({
                id: message.id,
                conversationId: message.conversationId,
            })
            .from(message)
            .where(eq(message.id, messageId))
            .limit(1);

        if (targetMessage.length === 0) {
            return Response.json(
                { error: "Message not found" },
                { status: 404 }
            );
        }

        const membership = await db
            .select({ id: conversationMember.id })
            .from(conversationMember)
            .where(
                and(
                    eq(
                        conversationMember.conversationId,
                        targetMessage[0].conversationId
                    ),
                    eq(conversationMember.userId, session.user.id)
                )
            )
            .limit(1);

        if (membership.length === 0) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const existing = await db
            .select()
            .from(messageReaction)
            .where(
                and(
                    eq(messageReaction.messageId, messageId),
                    eq(messageReaction.userId, session.user.id)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            if (existing[0].emoji === emoji) {
                await db
                    .delete(messageReaction)
                    .where(eq(messageReaction.id, existing[0].id));

                return Response.json({ reaction: null });
            }

            const updated = await db
                .update(messageReaction)
                .set({ emoji })
                .where(eq(messageReaction.id, existing[0].id))
                .returning();

            return Response.json({ reaction: updated[0] });
        }

        const created = await db
            .insert(messageReaction)
            .values({
                id: crypto.randomUUID(),
                messageId,
                userId: session.user.id,
                emoji,
            })
            .returning();

        return Response.json({ reaction: created[0] });
    } catch (error) {
        console.log("REACTION_ERROR:", error);
        return Response.json(
            { error: "Failed to react" },
            { status: 500 }
        );
    }
}
