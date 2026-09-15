import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Single light/dark toggle. Visitors get the OS/browser preference automatically
 * (ThemeProvider in App.tsx: defaultTheme="system" + enableSystem) until they click
 * this — from then on next-themes remembers the explicit choice in localStorage and
 * it wins over the OS setting on future visits.
 */
const ThemeToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined until next-themes' effect runs on mount — render a
  // neutral, invisible placeholder for that first tick rather than flashing the
  // wrong icon (or guessing, since we can't know the OS preference before then).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("shrink-0", className)}
    >
      {mounted ? (
        isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 opacity-0" aria-hidden />
      )}
    </Button>
  );
};

export default ThemeToggle;
