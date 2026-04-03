import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return <LoadingScreen message="AUTHORIZING ADMIN" />;
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};
