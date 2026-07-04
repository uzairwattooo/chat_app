"use client";

import UserCard from "./UserCard";

export default function UserList({ users, selectedChat, setSelectedChat, onlineUsers }) {
    return (
        <div className="space-y-2 transition-all duration-300">
            {users.map((conversation) => (
                <UserCard
                    key={conversation.conversationId}
                    user={conversation}
                    selected={selectedChat?.conversationId === conversation.conversationId}
                    online={onlineUsers.includes(conversation.user.id)}
                    onClick={() =>
                        setSelectedChat({
                            id: conversation.user.id,
                            name: conversation.user.name,
                            email: conversation.user.email,
                            image: conversation.user.image,
                            lastSeen: conversation.user.lastSeen,
                            conversationId: conversation.conversationId,
                        })
                    }
                />
            ))}
        </div>
    );
}