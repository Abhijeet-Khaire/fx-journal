import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, error: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Sync user to Firestore
                try {
                    const { doc, setDoc } = await import("firebase/firestore");
                    const { db } = await import("@/lib/firebase");
                    // const { FIRESTORE_PATHS } = await import("@/lib/firestorePaths");

                    const userDocRef = doc(db, "traders", currentUser.uid);

                    await setDoc(userDocRef, {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || "Trader",
                        photoURL: currentUser.photoURL,
                        lastSeen: new Date().toISOString(),
                        isAnonymous: currentUser.isAnonymous
                    }, { merge: true });
                } catch (err) {
                    console.error("Failed to sync user:", err);
                }
                setUser(currentUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
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
        <AuthContext.Provider value={{ user, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
