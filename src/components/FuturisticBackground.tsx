import React, { useEffect, useRef } from "react";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { motion } from "framer-motion";

export function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useThemeSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let logged = false;

    // Track window resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Get current primary color from computed CSS properties with dynamic fallbacks
    const getPrimaryColor = () => {
      try {
        const computed = window.getComputedStyle(document.documentElement);
        const rawProp = computed.getPropertyValue("--primary");
        const primaryStr = rawProp ? rawProp.trim() : "";
        
        if (!primaryStr) {
          return "hsl(187, 85%, 53%)"; // Cyan fallback
        }

        // If the browser already resolved it to rgb(...), hsl(...) or hex #...
        if (primaryStr.startsWith("rgb") || primaryStr.startsWith("hsl") || primaryStr.startsWith("#")) {
          return primaryStr;
        }

        // If it's space-separated digits, convert to standard comma-separated format (e.g. "187, 85%, 53%")
        const parts = primaryStr.split(/\s+/);
        if (parts.length === 3) {
          return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
        }

        return `hsl(${primaryStr})`;
      } catch (e) {
        return "hsl(187, 85%, 53%)";
      }
    };

    // Setup plexus particles (optimized for vibrant high-tech visibility)
    const particleCount = Math.min(60, Math.floor((width * height) / 20000));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1.5, // Bold glowing dots
      });
    }

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const colorPrimary = getPrimaryColor();
      
      if (!logged) {
        console.log("FX-JARVIS // Computed primary background color:", colorPrimary);
        logged = true;
      }

      ctx.fillStyle = colorPrimary;
      ctx.strokeStyle = colorPrimary;

      // Update & Draw Particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Boundary checks
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle core with a clear neon glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = colorPrimary;
        ctx.globalAlpha = 0.45; // Enhanced glowing core opacity
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw constellation Plexus connecting lines
      const maxDistance = 160;
      ctx.lineWidth = 1.0; // Thicker lines for visibility

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            // Fade lines based on proximity distance (increased visibility multiplier to 0.22)
            ctx.globalAlpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Dynamic plexus Canvas element */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Holographic Schematics Grid System Backdrop */}
      <div className="absolute inset-0 hex-grid opacity-[0.035]" />
      
      {/* Glowing Large HUD Vector Rings rotating very slowly (LHS & RHS) */}
      {/* High-visibility borders to ensure they are visible under all contrast levels */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 90, ease: "linear" }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full border-2 border-primary/20 pointer-events-none border-dashed hidden md:block"
        style={{ opacity: 0.6 }}
      >
        <div className="absolute inset-16 border border-primary/15 rounded-full border-dotted" />
        <div className="absolute inset-32 border-2 border-primary/12 rounded-full" />
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
        className="absolute -bottom-48 -right-48 w-[800px] h-[800px] rounded-full border-2 border-primary/18 pointer-events-none hidden lg:block"
        style={{ opacity: 0.5 }}
      >
        <div className="absolute inset-24 border border-dashed border-primary/12 rounded-full" />
        <div className="absolute inset-48 border border-primary/10 rounded-full" />
      </motion.div>
    </div>
  );
}
