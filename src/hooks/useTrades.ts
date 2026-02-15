import { useState, useEffect } from "react";
import { Trade } from "@/lib/tradeTypes";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { FIRESTORE_PATHS } from "@/lib/firestorePaths";

export function useTrades() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to real-time updates
        const docRef = doc(db, FIRESTORE_PATHS.TRADE_HISTORY.split('/')[0], FIRESTORE_PATHS.TRADE_HISTORY.split('/')[1]);

        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const rawTrades = docSnapshot.data().trades || [];
                // Normalize trades to ensure date is a string and numeric fields are valid
                const normalizedTrades = rawTrades.map((t: any) => ({
                    ...t,
                    id: t.id || crypto.randomUUID(),
                    date: typeof t.date === 'string' ? t.date : new Date(t.date?.seconds * 1000 || Date.now()).toISOString().split('T')[0],
                    time: t.time || "00:00",
                    pair: t.pair || "Unknown",
                    direction: t.direction || "BUY",
                    entryPrice: Number(t.entryPrice || 0),
                    exitPrice: Number(t.exitPrice || 0),
                    stopLoss: Number(t.stopLoss || 0),
                    takeProfit: Number(t.takeProfit || 0),
                    lotSize: Number(t.lotSize || 0),
                    profitLoss: Number(t.profitLoss ?? t.profit ?? 0),
                    pips: Number(t.pips || 0),
                    session: t.session || "Asian",
                    strategy: t.strategy || "Unknown",
                    rulesFollowed: !!t.rulesFollowed,
                    notes: t.notes || "",
                    emotionBefore: t.emotionBefore || "",
                    emotionAfter: t.emotionAfter || "",
                    confidence: Number(t.confidence || 0),
                    mistakes: t.mistakes || []
                }));
                // Sort by date desc
                normalizedTrades.sort((a, b) =>
                    new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime()
                );
                setTrades(normalizedTrades as Trade[]);
            } else {
                // Initialize document if it doesn't exist
                setDoc(docRef, { trades: [] }).catch(err => {
                    console.error("Error creating trade history doc:", err);
                });
                setTrades([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error subscribing to trades:", error);
            toast.error(`Load failed: ${error.message}`);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addTrade = async (tradeData: Omit<Trade, "id" | "userId">) => {
        try {
            // Simple ID generator fallback for non-secure contexts
            const generateId = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    return crypto.randomUUID();
                }
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            };

            const newTrade: Trade = {
                ...tradeData,
                id: generateId(),
                userId: "dummy-user-123", // Matches dummy user in AuthContext
                createdAt: new Date().toISOString()
            };

            const docRef = doc(db, FIRESTORE_PATHS.TRADE_HISTORY.split('/')[0], FIRESTORE_PATHS.TRADE_HISTORY.split('/')[1]);

            // Use arrayUnion to add the new trade
            await updateDoc(docRef, {
                trades: arrayUnion(newTrade)
            });

            toast.success("Trade added (Server)");
        } catch (error: any) {
            console.error("Error adding trade:", error);
            toast.error(`Add failed: ${error.message}`);
        }
    };

    const deleteTrade = async (id: string) => {
        try {
            const docRef = doc(db, FIRESTORE_PATHS.TRADE_HISTORY.split('/')[0], FIRESTORE_PATHS.TRADE_HISTORY.split('/')[1]);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const currentTrades = (docSnap.data().trades || []) as Trade[];
                const updatedTrades = currentTrades.filter(t => t.id !== id);

                await updateDoc(docRef, {
                    trades: updatedTrades
                });
                toast.success("Trade deleted (Server)");
            }
        } catch (error: any) {
            console.error("Error deleting trade:", error);
            toast.error(`Delete failed: ${error.message}`);
        }
    };

    const updateTrade = async (id: string, tradeUpdate: Partial<Trade>) => {
        try {
            const docRef = doc(db, FIRESTORE_PATHS.TRADE_HISTORY.split('/')[0], FIRESTORE_PATHS.TRADE_HISTORY.split('/')[1]);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const currentTrades = (docSnap.data().trades || []) as Trade[];
                const updatedTrades = currentTrades.map(t =>
                    t.id === id ? { ...t, ...tradeUpdate } : t
                );

                await updateDoc(docRef, {
                    trades: updatedTrades
                });
                toast.success("Trade updated (Server)");
            }
        } catch (error: any) {
            console.error("Error updating trade:", error);
            toast.error(`Update failed: ${error.message}`);
        }
    };

    return { trades, loading, addTrade, deleteTrade, updateTrade };
}
