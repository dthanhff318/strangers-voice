import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  created_at: string;
  user_id: string;
  message: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface LiveChatProps {
  roomId: string;
}

export function LiveChat({ roomId }: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;

    loadMessages();

    // Set up realtime subscription
    channelRef.current = supabase
      .channel(`live_chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch user info for the new message
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: ChatMessage = {
            id: payload.new.id,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            message: payload.new.message,
            user: userData || undefined,
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("live_chat_messages" as any)
        .select(
          `
          id,
          created_at,
          user_id,
          message,
          user:profiles(full_name, avatar_url)
        `
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages((data as any) || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to chat");
      return;
    }

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;

    try {
      setSending(true);
      const { error } = await supabase.from("live_chat_messages" as any).insert({
        room_id: roomId,
        user_id: user.id,
        message: trimmedMessage,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border)]">
        <div className="text-center space-y-2">
          <p className="text-[var(--color-text-primary)] font-medium">
            Live Chat
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sign in to participate in the chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          Live Chat
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--color-text-muted)]">
              No messages yet. Be the first to chat!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            return (
              <div key={msg.id} className="flex gap-3 items-start">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={msg.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {msg.user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {msg.user?.full_name || "Anonymous"}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] break-words mt-0.5">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="px-6 py-4 border-t border-[var(--color-border)] flex-shrink-0"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            maxLength={500}
            className="flex-1 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-[var(--color-btn-primary-text)]" />
          </Button>
        </div>
      </form>
    </div>
  );
}
