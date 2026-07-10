import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer,uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    isOnline: boolean("is_online").default(false),
    lastSeen: timestamp("last_seen"),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));


export const conversation = pgTable("conversation", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
export const conversationMember = pgTable(
    "conversation_member",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        conversationId: text("conversation_id")
            .notNull()
            .references(() => conversation.id, {
                onDelete: "cascade",
            }),

        userId: text("user_id")
            .notNull()
            .references(() => user.id, {
                onDelete: "cascade",
            }),
        clearedAt: timestamp("cleared_at"),
        deletedAt: timestamp("deleted_at"),

        createdAt: timestamp("created_at")
            .defaultNow()
            .notNull(),
    }
);

export const message = pgTable("message", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    conversationId: text("conversation_id")
        .notNull()
        .references(() => conversation.id, {
            onDelete: "cascade",
        }),

    senderId: text("sender_id")
        .notNull()
        .references(() => user.id, {
            onDelete: "cascade",
        }),

    text: text("text").notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    seen: boolean("seen").default(false).notNull(),
    seenAt: timestamp("seen_at"),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    type: text("type").default("text").notNull(),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    replyToId: text("reply_to_id"),
});
export const messageReaction = pgTable(
    "message_reaction",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        messageId: text("message_id")
            .notNull()
            .references(() => message.id, { onDelete: "cascade" }),

        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        emoji: text("emoji").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("message_reaction_user_unique").on(
            table.messageId,
            table.userId
        ),
    ]
);