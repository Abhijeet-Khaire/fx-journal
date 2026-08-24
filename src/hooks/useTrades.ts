import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trade } from "@/lib/tradeTypes";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUserTrades,
  subscribeToUserTrades,
  addTradeDoc,
  deleteTradeDoc,
  updateTradeDoc,
} from "@/lib/tradeRepository";

export const tradeKeys = {
  all: (userId?: string) => ["trades", userId] as const,
  challenge: (userId?: string, challengeId?: string) => ["trades", userId, challengeId] as const,
};

export function useTrades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.uid;

  // 1. TanStack Query for caching and server state
  const {
    data: trades = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: tradeKeys.all(userId),
    queryFn: () => (userId ? fetchUserTrades(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache validity
  });

  // 2. Real-time background synchronization with Firestore
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserTrades(
      userId,
      (serverTrades) => {
        queryClient.setQueryData(tradeKeys.all(userId), serverTrades);
      },
      (err) => {
        if (err.code !== "permission-denied") {
          toast.error(`Sync error: ${err.message}`);
        }
      }
    );

    return () => unsubscribe();
  }, [userId, queryClient]);

  // 3. Optimistic Add Trade Mutation
  const addTradeMutation = useMutation({
    mutationFn: async (tradeData: Omit<Trade, "id" | "userId">) => {
      if (!userId) throw new Error("User not authenticated");
      return addTradeDoc(userId, tradeData);
    },
    onMutate: async (newTradeData) => {
      await queryClient.cancelQueries({ queryKey: tradeKeys.all(userId) });
      const previousTrades = queryClient.getQueryData<Trade[]>(tradeKeys.all(userId)) || [];

      const optimisticTrade: Trade = {
        ...newTradeData,
        id: `optimistic-${Date.now()}`,
        userId: userId || "",
        sourceDoc: newTradeData.challengeId ? `challenge_${newTradeData.challengeId}` : "main",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Trade[]>(tradeKeys.all(userId), [
        optimisticTrade,
        ...previousTrades,
      ]);

      return { previousTrades };
    },
    onError: (err: any, _newTrade, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(tradeKeys.all(userId), context.previousTrades);
      }
      toast.error(`Add failed: ${err.message}`);
    },
    onSuccess: () => {
      toast.success("Trade added");
    },
  });

  // 4. Optimistic Delete Trade Mutation
  const deleteTradeMutation = useMutation({
    mutationFn: async ({ id, challengeId }: { id: string; challengeId?: string }) => {
      if (!userId) throw new Error("User not authenticated");
      const currentTrades = queryClient.getQueryData<Trade[]>(tradeKeys.all(userId)) || [];
      const trade = currentTrades.find((t) => t.id === id);
      const sourceDoc = challengeId ? `challenge_${challengeId}` : trade?.sourceDoc || "main";
      return deleteTradeDoc(userId, id, sourceDoc);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: tradeKeys.all(userId) });
      const previousTrades = queryClient.getQueryData<Trade[]>(tradeKeys.all(userId)) || [];

      queryClient.setQueryData<Trade[]>(
        tradeKeys.all(userId),
        previousTrades.filter((t) => t.id !== id)
      );

      return { previousTrades };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(tradeKeys.all(userId), context.previousTrades);
      }
      toast.error(`Delete failed: ${err.message}`);
    },
    onSuccess: () => {
      toast.success("Trade deleted");
    },
  });

  // 5. Optimistic Update Trade Mutation
  const updateTradeMutation = useMutation({
    mutationFn: async ({
      id,
      tradeUpdate,
      currentChallengeId,
    }: {
      id: string;
      tradeUpdate: Partial<Trade>;
      currentChallengeId?: string;
    }) => {
      if (!userId) throw new Error("User not authenticated");
      return updateTradeDoc(userId, id, tradeUpdate, currentChallengeId);
    },
    onMutate: async ({ id, tradeUpdate }) => {
      await queryClient.cancelQueries({ queryKey: tradeKeys.all(userId) });
      const previousTrades = queryClient.getQueryData<Trade[]>(tradeKeys.all(userId)) || [];

      queryClient.setQueryData<Trade[]>(
        tradeKeys.all(userId),
        previousTrades.map((t) => (t.id === id ? { ...t, ...tradeUpdate } : t))
      );

      return { previousTrades };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(tradeKeys.all(userId), context.previousTrades);
      }
      toast.error(`Update failed: ${err.message}`);
    },
    onSuccess: () => {
      toast.success("Trade updated");
    },
  });

  return {
    trades,
    loading: isLoading && isFetching,
    error,
    addTrade: (tradeData: Omit<Trade, "id" | "userId">) => addTradeMutation.mutateAsync(tradeData),
    deleteTrade: (id: string, challengeId?: string) =>
      deleteTradeMutation.mutateAsync({ id, challengeId }),
    updateTrade: (id: string, tradeUpdate: Partial<Trade>, currentChallengeId?: string) =>
      updateTradeMutation.mutateAsync({ id, tradeUpdate, currentChallengeId }),
  };
}
