import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen message="SECURING ACCESS" />;
    }

    if (!user) {
        return <Navigate to="/auth" />;
    }

    return <>{children}</>;
};
