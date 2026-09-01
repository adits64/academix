import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={`Current theme: ${theme}. Click to switch.`}
      aria-label="Toggle theme"
    >
      {theme === 'light' && <Sun className="h-5 w-5 text-amber-500 transition-all" />}
      {theme === 'dark' && <Moon className="h-5 w-5 text-indigo-400 transition-all" />}
      {theme === 'system' && <Monitor className="h-5 w-5 text-slate-500 transition-all" />}
    </Button>
  );
}

export default ThemeToggle;
