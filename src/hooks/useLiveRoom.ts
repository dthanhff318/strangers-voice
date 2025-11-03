import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import {
  getLiveRoom,
  getLiveRooms,
  createLiveRoom,
} from "../lib/edgeFunctions";

type LiveRoom = Database["public"]["Tables"]["live_rooms"]["Row"];
type LiveRoomInsert = Database["public"]["Tables"]["live_rooms"]["Insert"];
type LiveRoomUpdate = Database["public"]["Tables"]["live_rooms"]["Update"];

interface LiveRoomWithHost extends LiveRoom {
  host?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useLiveRoom(roomId?: string) {
  const queryClient = useQueryClient();

  const {
    data: room,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["live-room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const { data, error: fetchError } = await getLiveRoom(roomId);
      if (fetchError) throw fetchError;
      return data?.data as LiveRoomWithHost | null;
    },
    enabled: !!roomId,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!roomId) return;

    const roomChannel = supabase
      .channel(`live_room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-room", roomId] });
        }
      )
      .subscribe();

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, queryClient]);

  const createRoom = useCallback(
    async (roomData: LiveRoomInsert): Promise<string | null> => {
      try {
        const { data, error: createError } = await createLiveRoom(
          roomData.title,
          roomData.description || undefined
        );

        if (createError) throw createError;

        queryClient.invalidateQueries({ queryKey: ["live-rooms"] });
        return data?.data?.id || null;
      } catch (err) {
        console.error("Error creating room:", err);
        return null;
      }
    },
    [queryClient]
  );

  const updateRoom = useCallback(
    async (id: string, updates: LiveRoomUpdate) => {
      try {
        const { error: updateError } = await supabase
          .from("live_rooms")
          .update(updates)
          .eq("id", id);

        if (updateError) throw updateError;

        queryClient.invalidateQueries({ queryKey: ["live-room", id] });
        queryClient.invalidateQueries({ queryKey: ["live-rooms"] });
      } catch (err) {
        console.error("Error updating room:", err);
      }
    },
    [queryClient]
  );

  const endRoom = useCallback(
    async (id: string) => {
      await updateRoom(id, {
        is_active: false,
        ended_at: new Date().toISOString(),
      });
    },
    [updateRoom]
  );

  const incrementListeners = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.rpc("increment_listeners", {
          room_id: id,
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["live-room", id] });
      } catch (err) {
        console.error("Error incrementing listeners:", err);
      }
    },
    [queryClient]
  );

  const decrementListeners = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.rpc("decrement_listeners", {
          room_id: id,
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["live-room", id] });
      } catch (err) {
        console.error("Error decrementing listeners:", err);
      }
    },
    [queryClient]
  );

  return {
    room: room || null,
    loading,
    error: error ? (error as Error).message : null,
    createRoom,
    updateRoom,
    endRoom,
    refetch,
    incrementListeners,
    decrementListeners,
  };
}

export function useLiveRooms() {
  const queryClient = useQueryClient();

  const {
    data: rooms = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["live-rooms"],
    queryFn: async () => {
      const { data, error: fetchError } = await getLiveRooms();
      if (fetchError) throw fetchError;
      return (data?.data || []) as LiveRoomWithHost[];
    },
    staleTime: 10000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("live_rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_rooms",
          filter: "is_active=eq.true",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-rooms"] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  return {
    rooms,
    loading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
