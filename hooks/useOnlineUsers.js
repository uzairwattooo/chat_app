"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useOnlineUsers(currentUser) {
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!currentUser?.id) return;

        const channel = supabase.channel("online-users", {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        const updatePresence = () => {
            const state = channel.presenceState();

            const ids = Object.keys(state);

            setOnlineUsers(ids);
        };

        channel
            .on("presence", { event: "sync" }, updatePresence)
            .on("presence", { event: "join" }, updatePresence)
            .on("presence", { event: "leave" }, updatePresence)
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        id: currentUser.id,
                        name: currentUser.name,
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    return onlineUsers;
}