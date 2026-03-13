import { useState, useEffect } from "react";
import { Trade } from "@/lib/tradeTypes";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
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

        // Subscribe to real-time updates for the entire collection
        // Path: traders/{uid}/trade-history/*
        console.log("Subscribing to all trades for user:", user.uid);
        const colRef = collection(db, "traders", user.uid, "trade-history");

        const unsubscribe = onSnapshot(colRef, (querySnapshot) => {
            let allTrades: Trade[] = [];
            
            querySnapshot.forEach((docSnap) => {
                const docName = docSnap.id;
                const rawTrades = docSnap.data().trades || [];
                
                const normalizedTrades = rawTrades.map((t: any) => ({
                    ...t,
                    id: t.id || crypto.randomUUID(),
                    userId: user.uid,
                    challengeId: docName.startsWith('challenge_') ? docName.replace('challenge_', '') : undefined,
                    sourceDoc: docName, // Helper for easier deletion/updates
                    date: typeof t.date === 'string' ? t.date : new Date(t.date?.seconds * 1000 || Date.now()).toISOString().split('T')[0],
                    pips: Number(t.pips || 0),
                    profitLoss: Number(t.profitLoss ?? t.profit ?? 0),
                }));
                allTrades = [...allTrades, ...normalizedTrades];
            });

            // Sort by date desc
            allTrades.sort((a, b) =>
                new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime()
            );
            
            setTrades(allTrades as Trade[]);
            setLoading(false);
        }, (error) => {
            console.error("Error subscribing to trades:", error);
            if (error.code !== 'permission-denied') {
                toast.error(`Load failed: ${error.message}`);
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
            const generateId = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            };

            const newTrade: Trade = {
                ...tradeData,
                id: generateId(),
                userId: user.uid,
                createdAt: new Date().toISOString()
            };

            const docName = tradeData.challengeId ? `challenge_${tradeData.challengeId}` : "main";
            const docRef = doc(db, "traders", user.uid, "trade-history", docName);

            await setDoc(docRef, {
                trades: arrayUnion(newTrade)
            }, { merge: true });

            toast.success("Trade added");
        } catch (error: any) {
            console.error("Error adding trade:", error);
            toast.error(`Add failed: ${error.message}`);
        }
    };

    const deleteTrade = async (id: string, challengeId?: string) => {
        if (!user) return;
        try {
            // Find the trade to get its sourceDoc if challengeId isn't provided
            const trade = trades.find(t => t.id === id);
            const docName = challengeId ? `challenge_${challengeId}` : (trade?.sourceDoc || "main");
            
            const docRef = doc(db, "traders", user.uid, "trade-history", docName);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const currentTrades = (docSnap.data().trades || []) as Trade[];
                const updatedTrades = currentTrades.filter(t => t.id !== id);

                await updateDoc(docRef, {
                    trades: updatedTrades
                });
                toast.success("Trade deleted");
            }
        } catch (error: any) {
            console.error("Error deleting trade:", error);
            toast.error(`Delete failed: ${error.message}`);
        }
    };

    const updateTrade = async (id: string, tradeUpdate: Partial<Trade>, currentChallengeId?: string) => {
        if (!user) return;
        try {
            const newChallengeId = tradeUpdate.challengeId;
            const hasMoved = currentChallengeId !== newChallengeId;

            if (!hasMoved) {
                // Normal update in place
                const docName = currentChallengeId ? `challenge_${currentChallengeId}` : "main";
                const docRef = doc(db, "traders", user.uid, "trade-history", docName);
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
            } else {
                // Handle moving between collections
                console.log(`Moving trade ${id} from ${currentChallengeId || 'main'} to ${newChallengeId || 'main'}`);
                
                // 1. Get from old location
                const oldDocName = currentChallengeId ? `challenge_${currentChallengeId}` : "main";
                const oldDocRef = doc(db, "traders", user.uid, "trade-history", oldDocName);
                const oldDocSnap = await getDoc(oldDocRef);
                
                if (!oldDocSnap.exists()) {
                    toast.error("Source trade not found");
                    return;
                }

                const oldTrades = (oldDocSnap.data().trades || []) as Trade[];
                const tradeToMove = oldTrades.find(t => t.id === id);

                if (!tradeToMove) {
                    toast.error("Trade not found in source");
                    return;
                }

                // 2. Prepare new data
                const updatedTrade = { ...tradeToMove, ...tradeUpdate };

                // 3. Remove from old
                const remainingTrades = oldTrades.filter(t => t.id !== id);
                await updateDoc(oldDocRef, { trades: remainingTrades });

                // 4. Add to new
                const newDocName = newChallengeId ? `challenge_${newChallengeId}` : "main";
                const newDocRef = doc(db, "traders", user.uid, "trade-history", newDocName);
                await setDoc(newDocRef, {
                    trades: arrayUnion(updatedTrade)
                }, { merge: true });

                toast.success("Trade moved and updated");
            }
        } catch (error: any) {
            console.error("Error updating trade:", error);
            toast.error(`Update failed: ${error.message}`);
        }
    };

    return { trades, loading, addTrade, deleteTrade, updateTrade };
}
