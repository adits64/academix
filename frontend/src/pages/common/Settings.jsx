import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, ShieldCheck, Paintbrush } from 'lucide-react';

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Configure application appearance theme, security preferences, and display settings.</p>
      </div>

      {/* Appearance Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center">
            <Paintbrush className="h-4 w-4 mr-2 text-primary" /> Appearance & Theme Mode
          </CardTitle>
          <CardDescription className="text-xs">
            Choose your preferred color theme for the Academix workspace interface.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-3 gap-3">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
            className="flex flex-col items-center justify-center h-20 space-y-1.5"
          >
            <Sun className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-semibold">Light</span>
          </Button>

          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
            className="flex flex-col items-center justify-center h-20 space-y-1.5"
          >
            <Moon className="h-5 w-5 text-indigo-400" />
            <span className="text-xs font-semibold">Dark</span>
          </Button>

          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            onClick={() => setTheme('system')}
            className="flex flex-col items-center justify-center h-20 space-y-1.5"
          >
            <Monitor className="h-5 w-5 text-slate-500" />
            <span className="text-xs font-semibold">System</span>
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Security Overview
          </CardTitle>
          <CardDescription className="text-xs">
            Session tokens are managed with JWT bearer security.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• Password updates are managed via the profile section or administrator reset.</p>
          <p>• Session state automatically expires when authentication tokens lapse.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
