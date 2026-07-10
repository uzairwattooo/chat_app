import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

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

        const profile = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        if (!profile.length) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return Response.json({
            user: profile[0],
        });
    } catch (error) {
        console.log("GET_PROFILE_ERROR:", error);

        return Response.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

export async function PATCH(req) {
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

        const { name, image } = await req.json();

        if (!name?.trim()) {
            return Response.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const updatedUser = await db
            .update(user)
            .set({
                name: name.trim(),
                image: image || null,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id))
            .returning({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            });

        return Response.json({
            user: updatedUser[0],
        });
    } catch (error) {
        console.log("UPDATE_PROFILE_ERROR:", error);

        return Response.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}