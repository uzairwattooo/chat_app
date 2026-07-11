import { auth } from "@/lib/auth";
import { db } from "@/db";
import { message, conversationMember, messageReaction } from "@/db/schema";
import { headers } from "next/headers";
import { and, eq, gt, inArray } from "drizzle-orm";

export async function GET(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
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
                    eq(conversationMember.conversationId, conversationId),
                    eq(conversationMember.userId, session.user.id)
                )
            )
            .limit(1);

        if (member.length === 0) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        if (member[0].deletedAt) {
            return Response.json({ messages: [] });
        }

        const messageCondition = member[0].clearedAt
            ? and(
                eq(message.conversationId, conversationId),
                gt(message.createdAt, member[0].clearedAt)
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

        const messageIds = messages.map((item) => item.id);
        const reactions =
            messageIds.length > 0
                ? await db
                    .select({
                        id: messageReaction.id,
                        messageId: messageReaction.messageId,
                        userId: messageReaction.userId,
                        emoji: messageReaction.emoji,
                    })
                    .from(messageReaction)
                    .where(inArray(messageReaction.messageId, messageIds))
                : [];

        const reactionsByMessage = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.messageId]) acc[reaction.messageId] = [];
            acc[reaction.messageId].push({
                id: reaction.id,
                userId: reaction.userId,
                emoji: reaction.emoji,
            });
            return acc;
        }, {});

        return Response.json({
            messages: messages.map((item) => ({
                ...item,
                reactions: reactionsByMessage[item.id] || [],
            })),
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
            messageId,
            conversationId,
            text,
            type = "text",
            fileUrl = null,
            fileName = null,
            mimeType = null,
            fileSize = null,
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

        const member = await db
            .select({
                deletedAt: conversationMember.deletedAt,
            })
            .from(conversationMember)
            .where(
                and(
                    eq(conversationMember.conversationId, conversationId),
                    eq(conversationMember.userId, session.user.id)
                )
            )
            .limit(1);

        if (member.length === 0) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        if (replyToId) {
            const repliedMessage = await db
                .select({ id: message.id })
                .from(message)
                .where(
                    and(
                        eq(message.id, replyToId),
                        eq(message.conversationId, conversationId)
                    )
                )
                .limit(1);

            if (repliedMessage.length === 0) {
                return Response.json(
                    { error: "Reply message is invalid" },
                    { status: 400 }
                );
            }
        }

        if (member[0].deletedAt) {
            await db
                .update(conversationMember)
                .set({ deletedAt: null })
                .where(
                    and(
                        eq(conversationMember.conversationId, conversationId),
                        eq(conversationMember.userId, session.user.id)
                    )
                );
        }

        const id = messageId || crypto.randomUUID();

        const existing = await db
            .select()
            .from(message)
            .where(eq(message.id, id))
            .limit(1);

        if (existing.length > 0) {
            if (existing[0].senderId !== session.user.id) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            return Response.json({ message: existing[0] });
        }

        const newMessage = await db
            .insert(message)
            .values({
                id,
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
        return Response.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
