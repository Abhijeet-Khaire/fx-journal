import React, { Component, ErrorInfo, ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <GlassCard className="max-w-md p-8 border-loss/20 bg-loss/5">
            <div className="p-4 rounded-full bg-loss/10 text-loss w-fit mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-8 text-balance">
              The application encountered an unexpected error. This might be due to a calculation glitch or data mismatch.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all hover:brightness-110 active:scale-95 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
