-- Run only if these tables are not already in supabase_realtime publication.
ALTER PUBLICATION supabase_realtime ADD TABLE public.message;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reaction;

-- Helpful indexes for chat speed.
CREATE INDEX IF NOT EXISTS message_conversation_created_idx
ON public.message (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS message_reaction_message_idx
ON public.message_reaction (message_id);

CREATE INDEX IF NOT EXISTS conversation_member_user_conversation_idx
ON public.conversation_member (user_id, conversation_id);
