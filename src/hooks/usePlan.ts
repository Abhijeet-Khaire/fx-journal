import { useState, useEffect } from "react";
import { type Plan } from "@/lib/tradeTypes";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePlan() {
    const { user } = useAuth();
    const [plan, setPlanState] = useState<Plan>("free");
    const [loading, setLoading] = useState(true);
    const [joinedDate, setJoinedDate] = useState<string | null>(null);
    const [isTrial, setIsTrial] = useState(false);

    useEffect(() => {
        if (!user) {
            setPlanState("free");
            setJoinedDate(null);
            setIsTrial(false);
            setLoading(false);
            return;
        }

        const userRef = doc(db, "traders", user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const actualPlan = (userData.plan as Plan) || "free";
                const jDate = userData.joinedDate;
                setJoinedDate(jDate);

                // Trial Logic: 72 hours of Professional Access for new users
                if (jDate) {
                    const joinedAt = new Date(jDate).getTime();
                    const now = new Date().getTime();
                    const seventyTwoHours = 72 * 60 * 60 * 1000;
                    const isWithinTrial = (now - joinedAt) < seventyTwoHours;

                    if (isWithinTrial && (actualPlan === "free")) {
                        setPlanState("pro");
                        setIsTrial(true);
                    } else {
                        setPlanState(actualPlan);
                        setIsTrial(false);
                    }
                } else {
                    setPlanState(actualPlan);
                    setIsTrial(false);
                }
            } else {
                setPlanState("free");
                setIsTrial(false);
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

    return { plan, upgradePlan, loading, joinedDate, isTrial };
}
