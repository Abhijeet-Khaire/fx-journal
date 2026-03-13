import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence, useVelocity, useTransform } from "framer-motion";

export function CustomCursor() {
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    // Core position
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Velocity-based stretching
    const velX = useVelocity(cursorX);
    const velY = useVelocity(cursorY);
    
    // Calculate total velocity magnitude
    const velocity = useTransform(
        [velX, velY],
        ([latestVelX, latestVelY]) => Math.sqrt(Math.pow(latestVelX as number, 2) + Math.pow(latestVelY as number, 2))
    );

    // Maps velocity to skew and stretch
    const scaleX = useTransform(velocity, [0, 3000], [1, 2.5]);
    const scaleY = useTransform(velocity, [0, 3000], [1, 0.6]);
    const opacity = useTransform(velocity, [0, 3000], [1, 0.4]);

    // Spring physics for the soft aura (lag effect)
    const springConfig = { damping: 40, stiffness: 300, mass: 1 };
    const auraX = useSpring(cursorX, springConfig);
    const auraY = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable = 
                target.closest('button') || 
                target.closest('a') || 
                target.closest('input') || 
                target.closest('[role="button"]') ||
                window.getComputedStyle(target).cursor === 'pointer';
            
            setIsHovered(!!isClickable);
        };

        const mouseDown = () => setIsClicked(true);
        const mouseUp = () => setIsClicked(false);

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mouseover", handleHover);
        window.addEventListener("mousedown", mouseDown);
        window.addEventListener("mouseup", mouseUp);
        
        document.addEventListener("mouseleave", () => setIsVisible(false));
        document.addEventListener("mouseenter", () => setIsVisible(true));

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleHover);
            window.removeEventListener("mousedown", mouseDown);
            window.removeEventListener("mouseup", mouseUp);
        };
    }, [cursorX, cursorY, isVisible]);

    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    if (!isVisible || isTouchDevice) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] hidden lg:block overflow-hidden">
            {/* Soft Ambient Aura */}
            <motion.div
                style={{
                    x: auraX,
                    y: auraY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                className="absolute w-40 h-40 bg-cyan-500/10 rounded-full blur-[40px]"
                animate={{
                    scale: isHovered ? 1.5 : 1,
                    opacity: isHovered ? 0.6 : 0.3,
                }}
            />

            {/* Targeting HUD Brackets (Hover Only) */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        style={{
                            x: cursorX,
                            y: cursorY,
                            translateX: "-50%",
                            translateY: "-50%",
                        }}
                        className="absolute w-12 h-12"
                    >
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/80" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/80" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/80" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/80" />
                        
                        {/* HUD Scanning Line */}
                        <motion.div 
                            animate={{ top: ["10%", "90%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[1px] bg-cyan-400/20"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Singularity Core */}
            <motion.div
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                    scaleX,
                    scaleY,
                    opacity,
                }}
                className="absolute"
            >
                {/* Core Point */}
                <motion.div 
                    className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff,0_0_30px_rgba(0,255,255,0.8)] cursor-core"
                    animate={{
                        scale: isClicked ? 0.5 : (isHovered ? 0.8 : 1),
                        background: isHovered ? "#22d3ee" : undefined,
                    }}
                />
                
                {/* Micro Orbital */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-4px] border border-cyan-400/20 rounded-full"
                />
            </motion.div>

            {/* Click Ripple Effect */}
            <AnimatePresence>
                {isClicked && (
                    <motion.div
                        initial={{ opacity: 0.8, scale: 0 }}
                        animate={{ opacity: 0, scale: 4 }}
                        exit={{ opacity: 0 }}
                        style={{
                            x: cursorX,
                            y: cursorY,
                            translateX: "-50%",
                            translateY: "-50%",
                        }}
                        className="absolute w-8 h-8 border border-white/40 rounded-full"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
