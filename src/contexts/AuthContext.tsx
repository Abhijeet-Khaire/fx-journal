import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true, error: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const { doc, setDoc, onSnapshot } = await import("firebase/firestore");
                    const { db } = await import("@/lib/firebase");

                    const userDocRef = doc(db, "traders", currentUser.uid);

                    // Sync user to Firestore but don't overwrite role if it exists
                    await setDoc(userDocRef, {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || "Trader",
                        photoURL: currentUser.photoURL,
                        lastSeen: new Date().toISOString(),
                        isAnonymous: currentUser.isAnonymous
                    }, { merge: true });

                    // Listen to the user document to track the `role`
                    unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setIsAdmin(data.role === "superadmin");
                        } else {
                            setIsAdmin(false);
                        }
                    });

                } catch (err) {
                    console.error("Failed to sync user or listen to role:", err);
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setIsAdmin(false);
                if (unsubscribeSnapshot) {
                    unsubscribeSnapshot();
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">Loading FX Journal...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background p-4">
                <div className="max-w-md text-center space-y-4">
                    <h2 className="text-xl font-bold text-destructive">Initialization Error</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md text-left font-mono">
                        <p>1. Check your .env file exists</p>
                        <p>2. Verify Firebase config values</p>
                        <p>3. Restart the dev server</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
