import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
    conversation,
    conversationMember,
    message,
    user,
} from "@/db/schema";
import { headers } from "next/headers";
import {
    and,
    desc,
    eq,
    gt,
    inArray,
    isNull,
    ne,
} from "drizzle-orm";

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await req.json();
        const currentUserId = session.user.id;

        if (!userId) {
            return Response.json(
                { error: "User id is required" },
                { status: 400 }
            );
        }

        if (userId === currentUserId) {
            return Response.json(
                { error: "You cannot start a chat with yourself" },
                { status: 400 }
            );
        }

        const myConversations = await db
            .select({
                conversationId: conversationMember.conversationId,
            })
            .from(conversationMember)
            .where(eq(conversationMember.userId, currentUserId));

        const myConversationIds = myConversations.map(
            (item) => item.conversationId
        );

        if (myConversationIds.length > 0) {
            const existingConversation = await db
                .select({
                    conversationId: conversationMember.conversationId,
                })
                .from(conversationMember)
                .where(
                    and(
                        eq(conversationMember.userId, userId),
                        inArray(
                            conversationMember.conversationId,
                            myConversationIds
                        )
                    )
                )
                .limit(1);

            if (existingConversation.length > 0) {
                const existingConversationId =
                    existingConversation[0].conversationId;

                // Current user ne chat delete ki thi to wapas sidebar me lao.
                await db
                    .update(conversationMember)
                    .set({
                        deletedAt: null,
                    })
                    .where(
                        and(
                            eq(
                                conversationMember.conversationId,
                                existingConversationId
                            ),
                            eq(conversationMember.userId, currentUserId)
                        )
                    );

                return Response.json({
                    conversationId: existingConversationId,
                });
            }
        }

        const newConversationId = crypto.randomUUID();

        await db.insert(conversation).values({
            id: newConversationId,
        });

        await db.insert(conversationMember).values([
            {
                id: crypto.randomUUID(),
                conversationId: newConversationId,
                userId: currentUserId,
            },
            {
                id: crypto.randomUUID(),
                conversationId: newConversationId,
                userId,
            },
        ]);

        return Response.json({
            conversationId: newConversationId,
        });
    } catch (error) {
        console.log("CONVERSATION_API_ERROR:", error);

        return Response.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Sirf current user ki non-deleted conversations.
        const myMembers = await db
            .select({
                conversationId: conversationMember.conversationId,
                clearedAt: conversationMember.clearedAt,
            })
            .from(conversationMember)
            .where(
                and(
                    eq(conversationMember.userId, session.user.id),
                    isNull(conversationMember.deletedAt)
                )
            );

        if (myMembers.length === 0) {
            return Response.json({ conversations: [] });
        }

        const conversationIds = myMembers.map(
            (item) => item.conversationId
        );

        const clearedAtMap = new Map(
            myMembers.map((item) => [
                item.conversationId,
                item.clearedAt,
            ])
        );

        const otherMembers = await db
            .select({
                conversationId: conversationMember.conversationId,
                userId: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                lastSeen: user.lastSeen,
            })
            .from(conversationMember)
            .innerJoin(user, eq(conversationMember.userId, user.id))
            .where(
                and(
                    inArray(
                        conversationMember.conversationId,
                        conversationIds
                    ),
                    ne(conversationMember.userId, session.user.id)
                )
            );

        const rows = await Promise.all(
            otherMembers.map(async (member) => {
                const clearedAt = clearedAtMap.get(
                    member.conversationId
                );

                const lastMessageCondition = clearedAt
                    ? and(
                        eq(
                            message.conversationId,
                            member.conversationId
                        ),
                        gt(message.createdAt, clearedAt)
                    )
                    : eq(
                        message.conversationId,
                        member.conversationId
                    );

                const last = await db
                    .select({
                        text: message.text,
                        type: message.type,
                        fileName: message.fileName,
                        createdAt: message.createdAt,
                    })
                    .from(message)
                    .where(lastMessageCondition)
                    .orderBy(desc(message.createdAt))
                    .limit(1);

                let lastMessage = "No messages yet";

                if (last[0]) {
                    if (last[0].type === "image") {
                        lastMessage = "📷 Image";
                    } else if (last[0].type === "video") {
                        lastMessage = "🎥 Video";
                    } else if (last[0].type === "audio") {
                        lastMessage = "🎵 Audio";
                    } else if (last[0].type === "file") {
                        lastMessage = `📄 ${last[0].fileName || "Document"}`;
                    } else {
                        lastMessage = last[0].text;
                    }
                }

                return {
                    conversationId: member.conversationId,
                    user: {
                        id: member.userId,
                        name: member.name,
                        email: member.email,
                        image: member.image,
                        lastSeen: member.lastSeen,
                    },
                    lastMessage,
                    lastMessageTime: last[0]?.createdAt || null,
                };
            })
        );

        rows.sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;

            return (
                new Date(b.lastMessageTime) -
                new Date(a.lastMessageTime)
            );
        });

        return Response.json({ conversations: rows });
    } catch (error) {
        console.log("GET_CONVERSATIONS_ERROR:", error);

        return Response.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}