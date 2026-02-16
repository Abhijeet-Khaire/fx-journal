import { useState, useEffect } from "react";
import { type Plan } from "@/lib/tradeTypes";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePlan() {
    const { user } = useAuth();
    const [plan, setPlanState] = useState<Plan>("free");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setPlanState("free");
            setLoading(false);
            return;
        }

        const userRef = doc(db, "traders", user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                console.log("Plan loaded from DB:", userData.plan);
                setPlanState((userData.plan as Plan) || "free");
            } else {
                console.log("No user doc found for plan, defaulting to free");
                setPlanState("free");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const upgradePlan = async (newPlan: Plan) => {
        if (!user) return;
        try {
            const userRef = doc(db, "traders", user.uid);
            await setDoc(userRef, { plan: newPlan }, { merge: true });
            setPlanState(newPlan);
        } catch (error) {
            console.error("Error updating plan:", error);
        }
    };

    return { plan, upgradePlan, loading };
}
