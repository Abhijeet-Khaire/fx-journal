import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { Trade } from "./tradeTypes";

export function normalizeRawTrades(docName: string, rawTrades: any[], userId: string): Trade[] {
  return rawTrades.map((t: any) => ({
    ...t,
    id: t.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    userId,
    challengeId: docName.startsWith("challenge_") ? docName.replace("challenge_", "") : undefined,
    sourceDoc: docName,
    date: typeof t.date === "string" ? t.date : new Date(t.date?.seconds * 1000 || Date.now()).toISOString().split("T")[0],
    pips: Number(t.pips || 0),
    profitLoss: Number(t.profitLoss ?? t.profit ?? 0),
  }));
}

export function sortTradesDesc(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return new Date(`${b.date}T${timeB}`).getTime() - new Date(`${a.date}T${timeA}`).getTime();
  });
}

/**
 * Fetches all trades for a given user from /traders/{userId}/trade-history
 */
export async function fetchUserTrades(userId: string): Promise<Trade[]> {
  if (!userId) return [];
  const colRef = collection(db, "traders", userId, "trade-history");
  const querySnapshot = await getDocs(colRef);
  let allTrades: Trade[] = [];

  querySnapshot.forEach((docSnap) => {
    const docName = docSnap.id;
    const rawTrades = docSnap.data().trades || [];
    allTrades = allTrades.concat(normalizeRawTrades(docName, rawTrades, userId));
  });

  return sortTradesDesc(allTrades);
}

/**
 * Subscribes to real-time updates for all trades of a given user.
 */
export function subscribeToUserTrades(
  userId: string,
  onUpdate: (trades: Trade[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = collection(db, "traders", userId, "trade-history");
  return onSnapshot(
    colRef,
    (querySnapshot) => {
      let allTrades: Trade[] = [];
      querySnapshot.forEach((docSnap) => {
        const docName = docSnap.id;
        const rawTrades = docSnap.data().trades || [];
        allTrades = allTrades.concat(normalizeRawTrades(docName, rawTrades, userId));
      });
      onUpdate(sortTradesDesc(allTrades));
    },
    (error) => {
      console.error("Firestore trades subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Adds a new trade to Firestore.
 */
export async function addTradeDoc(
  userId: string,
  tradeData: Omit<Trade, "id" | "userId">
): Promise<Trade> {
  if (!userId) throw new Error("Authentication required");

  const generateId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const docName = tradeData.challengeId ? `challenge_${tradeData.challengeId}` : "main";
  const newTrade: Trade = {
    ...tradeData,
    id: generateId(),
    userId,
    sourceDoc: docName,
    createdAt: new Date().toISOString(),
  };

  const docRef = doc(db, "traders", userId, "trade-history", docName);
  await setDoc(
    docRef,
    {
      trades: arrayUnion(newTrade),
    },
    { merge: true }
  );

  return newTrade;
}

/**
 * Deletes a trade by ID from Firestore.
 */
export async function deleteTradeDoc(
  userId: string,
  tradeId: string,
  sourceDoc: string = "main"
): Promise<void> {
  if (!userId) throw new Error("Authentication required");

  const docRef = doc(db, "traders", userId, "trade-history", sourceDoc);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentTrades = (docSnap.data().trades || []) as Trade[];
    const updatedTrades = currentTrades.filter((t) => t.id !== tradeId);
    await updateDoc(docRef, { trades: updatedTrades });
  }
}

/**
 * Updates a trade in Firestore, handling movement between challenge/main documents if needed.
 */
export async function updateTradeDoc(
  userId: string,
  tradeId: string,
  tradeUpdate: Partial<Trade>,
  currentChallengeId?: string
): Promise<void> {
  if (!userId) throw new Error("Authentication required");

  const normalizedCurrent = currentChallengeId || "";
  const normalizedNew = tradeUpdate.challengeId || "";
  const hasMoved = normalizedCurrent !== normalizedNew;

  const oldDocName = normalizedCurrent ? `challenge_${normalizedCurrent}` : "main";

  if (!hasMoved) {
    const docRef = doc(db, "traders", userId, "trade-history", oldDocName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentTrades = (docSnap.data().trades || []) as Trade[];
      const updatedTrades = currentTrades.map((t) =>
        t.id === tradeId ? { ...t, ...tradeUpdate } : t
      );
      await updateDoc(docRef, { trades: updatedTrades });
    }
  } else {
    // Moved to another challenge or back to main
    const oldDocRef = doc(db, "traders", userId, "trade-history", oldDocName);
    const oldDocSnap = await getDoc(oldDocRef);

    if (!oldDocSnap.exists()) {
      throw new Error("Source trade document not found");
    }

    const oldTrades = (oldDocSnap.data().trades || []) as Trade[];
    const tradeToMove = oldTrades.find((t) => t.id === tradeId);

    if (!tradeToMove) {
      throw new Error("Trade not found in source document");
    }

    const updatedTrade: Trade = {
      ...tradeToMove,
      ...tradeUpdate,
      sourceDoc: normalizedNew ? `challenge_${normalizedNew}` : "main",
    };

    const remainingTrades = oldTrades.filter((t) => t.id !== tradeId);
    await updateDoc(oldDocRef, { trades: remainingTrades });

    const newDocName = normalizedNew ? `challenge_${normalizedNew}` : "main";
    const newDocRef = doc(db, "traders", userId, "trade-history", newDocName);
    await setDoc(
      newDocRef,
      {
        trades: arrayUnion(updatedTrade),
      },
      { merge: true }
    );
  }
}
