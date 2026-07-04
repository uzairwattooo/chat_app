import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversation, conversationMember, message, user } from "@/db/schema";
import { headers } from "next/headers";
import { and, desc, eq, inArray, ne } from "drizzle-orm";


export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { userId } = await req.json();

        if (!userId) {
            return Response.json({ error: "User id is required" }, { status: 400 });
        }

        const currentUserId = session.user.id;

        const myConversations = await db
            .select({ conversationId: conversationMember.conversationId })
            .from(conversationMember)
            .where(eq(conversationMember.userId, currentUserId));

        const myConversationIds = myConversations.map((item) => item.conversationId);

        if (myConversationIds.length > 0) {
            const existingConversation = await db
                .select({ conversationId: conversationMember.conversationId })
                .from(conversationMember)
                .where(
                    and(
                        eq(conversationMember.userId, userId),
                        inArray(conversationMember.conversationId, myConversationIds)
                    )
                )
                .limit(1);

            if (existingConversation.length > 0) {
                return Response.json({
                    conversationId: existingConversation[0].conversationId,
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

        const myMembers = await db
            .select({ conversationId: conversationMember.conversationId })
            .from(conversationMember)
            .where(eq(conversationMember.userId, session.user.id));

        const conversationIds = myMembers.map((item) => item.conversationId);

        if (conversationIds.length === 0) {
            return Response.json({ conversations: [] });
        }

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
                    inArray(conversationMember.conversationId, conversationIds),
                    ne(conversationMember.userId, session.user.id)
                )
            );

        const rows = await Promise.all(
            otherMembers.map(async (member) => {
                const last = await db
                    .select()
                    .from(message)
                    .where(eq(message.conversationId, member.conversationId))
                    .orderBy(desc(message.createdAt))
                    .limit(1);

                return {
                    conversationId: member.conversationId,
                    user: {
                        id: member.userId,
                        name: member.name,
                        email: member.email,
                        image: member.image,
                        lastSeen: member.lastSeen,
                    },
                    lastMessage: last[0]?.text || "No messages yet",
                    lastMessageTime: last[0]?.createdAt || null,
                };
            })
        );

        rows.sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
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