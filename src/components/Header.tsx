import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { motion } from "framer-motion";

interface HeaderProps {
    onMenuClick: () => void;
    isOpen: boolean;
    pageTitle?: string;
}

export function Header({ onMenuClick, isOpen, pageTitle }: HeaderProps) {
    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 text-cyan-400" />
                <span className="font-bold text-foreground tracking-tight">FX Journal</span>
            </div>

            <div className="flex items-center gap-3">
                {pageTitle && (
                    <span className="text-sm font-medium text-muted-foreground mr-2">
                        {pageTitle}
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="relative z-50 transition-colors"
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-foreground" />
                    ) : (
                        <Menu className="w-6 h-6 text-foreground" />
                    )}
                </Button>
            </div>
        </header>
    );
}
