import { auth } from "@/lib/auth";
import { db } from "@/db";
import { message, conversationMember, messageReaction } from "@/db/schema";
import { headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

export async function GET(req) {
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

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return Response.json(
                { error: "Conversation id is required" },
                { status: 400 }
            );
        }

        const member = await db
            .select({
                clearedAt: conversationMember.clearedAt,
                deletedAt: conversationMember.deletedAt,
            })
            .from(conversationMember)
            .where(
                and(
                    eq(
                        conversationMember.conversationId,
                        conversationId
                    ),
                    eq(
                        conversationMember.userId,
                        session.user.id
                    )
                )
            )
            .limit(1);

        if (member.length === 0) {
            return Response.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        if (member[0].deletedAt) {
            return Response.json({ messages: [] });
        }

        const clearedAt = member[0].clearedAt;

        const messageCondition = clearedAt
            ? and(
                eq(message.conversationId, conversationId),
                gt(message.createdAt, clearedAt)
            )
            : eq(message.conversationId, conversationId);

        const messages = await db
            .select({
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                text: message.text,
                seen: message.seen,
                seenAt: message.seenAt,
                createdAt: message.createdAt,
                editedAt: message.editedAt,
                deletedAt: message.deletedAt,
                type: message.type,
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                mimeType: message.mimeType,
                fileSize: message.fileSize,
                replyToId: message.replyToId,
            })
            .from(message)
            .where(messageCondition)
            .orderBy(message.createdAt);

        const messagesWithReactions = await Promise.all(
            messages.map(async (item) => {
                const reactions = await db
                    .select({
                        id: messageReaction.id,
                        userId: messageReaction.userId,
                        emoji: messageReaction.emoji,
                    })
                    .from(messageReaction)
                    .where(
                        eq(messageReaction.messageId, item.id)
                    );

                return {
                    ...item,
                    reactions,
                };
            })
        );

        return Response.json({
            messages: messagesWithReactions,
        });
    } catch (error) {
        console.log("GET_MESSAGES_ERROR:", error);

        return Response.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            conversationId,
            text,
            type = "text",
            fileUrl,
            fileName,
            mimeType,
            fileSize,
            replyToId = null,
        } = await req.json();

        if (!conversationId) {
            return Response.json(
                { error: "Conversation id is required" },
                { status: 400 }
            );
        }

        if (!text?.trim() && !fileUrl) {
            return Response.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }
        const isMember = await db
            .select()
            .from(conversationMember)
            .where(
                and(
                    eq(conversationMember.conversationId, conversationId),
                    eq(conversationMember.userId, session.user.id)
                )
            )
            .limit(1);

        if (isMember.length === 0) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        await db
            .update(conversationMember)
            .set({
                deletedAt: null,
            })
            .where(
                and(
                    eq(conversationMember.conversationId, conversationId),
                    eq(conversationMember.userId, session.user.id)
                )
            );

        const newMessage = await db
            .insert(message)
            .values({
                id: crypto.randomUUID(),
                conversationId,
                senderId: session.user.id,
                text: text?.trim() || "",
                type,
                fileUrl,
                fileName,
                mimeType,
                fileSize,
                replyToId,

            })
            .returning();

        return Response.json({ message: newMessage[0] });
    } catch (error) {
        console.log("SEND_MESSAGE_ERROR:", error);
        return Response.json({ error: "Failed to send message" }, { status: 500 });
    }
}