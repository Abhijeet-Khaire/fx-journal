import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "hsl(var(--glass))",
          backdropFilter: "blur(16px)",
          border: "1px solid hsl(var(--glass-border)/0.5)",
          color: "hsl(var(--foreground))",
          borderRadius: "1rem",
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_0_30px_-5px_hsl(var(--cyan-glow)/0.2)]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-loss group-[.toast]:text-white font-bold rounded-lg px-4",
          cancelButton: "group-[.toast]:bg-secondary group-[.toast]:text-muted-foreground rounded-lg px-4",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
