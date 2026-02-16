import { useState, useEffect } from "react";
import { Trade } from "@/lib/tradeTypes";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export function useTrades() {
    const { user } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTrades([]);
            setLoading(false);
            return;
        }

        // Subscribe to real-time updates for the specific user
        // Path: traders/{uid}/trade-history/main
        console.log("Subscribing to trades for user:", user.uid);
        const docRef = doc(db, "traders", user.uid, "trade-history", "main");

        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                console.log("Trade history doc exists, data:", docSnapshot.data());
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
                console.log("Trade history doc does not exist. Initializing...");
                // Initialize document if it doesn't exist for this user
                setDoc(docRef, { trades: [] }, { merge: true })
                    .then(() => console.log("Trade history initialized"))
                    .catch(err => {
                        console.error("Error creating trade history doc:", err);
                        toast.error(`Init failed: ${err.message}`);
                    });
                setTrades([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error subscribing to trades:", error);
            // Don't show toast on permission denied if likely just not logged in/rules issue
            if (error.code !== 'permission-denied') {
                toast.error(`Load failed: ${error.message}`);
            } else {
                console.warn("Permission denied for trade history. Check Firestore rules.");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addTrade = async (tradeData: Omit<Trade, "id" | "userId">) => {
        if (!user) {
            toast.error("You must be logged in to add trades.");
            return;
        }

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
                userId: user.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = doc(db, "traders", user.uid, "trade-history", "main");

            // Use arrayUnion to add the new trade
            // Accessing docRef triggers creation if we use setDoc with merge, but updateDoc fails if doc doesn't exist.
            // Check existence or use setDoc with merge for safety on first trade?
            // The listener usually creates it, but race conditions exist.
            // Using setDoc with merge: true and arrayUnion is safe.
            await setDoc(docRef, {
                trades: arrayUnion(newTrade)
            }, { merge: true });

            toast.success("Trade added (Server)");
        } catch (error: any) {
            console.error("Error adding trade:", error);
            toast.error(`Add failed: ${error.message}`);
        }
    };

    const deleteTrade = async (id: string) => {
        if (!user) return;
        try {
            const docRef = doc(db, "traders", user.uid, "trade-history", "main");
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
        if (!user) return;
        try {
            const docRef = doc(db, "traders", user.uid, "trade-history", "main");
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
