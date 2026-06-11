'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Database, Shield, Info, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [fixingStats, setFixingStats] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleFixStats = async () => {
    setFixingStats(true);
    setFixResult(null);
    try {
      const res = await fetch('/api/fix-stats', { method: 'POST' });
      const data = await res.json();
      setFixResult(data.message || 'Stats recalculated successfully');
    } catch {
      setFixResult('Failed to fix stats');
    } finally {
      setFixingStats(false);
    }
  };

  const handleTestDb = async () => {
    setTestingDb(true);
    setDbStatus(null);
    try {
      const res = await fetch('/api/test-connection');
      const data = await res.json();
      setDbStatus({ success: data.success, message: data.message || 'Connection test complete' });
    } catch {
      setDbStatus({ success: false, message: 'Connection failed' });
    } finally {
      setTestingDb(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage application configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database
          </CardTitle>
          <CardDescription>Database connection and maintenance tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Test Connection</p>
              <p className="text-sm text-muted-foreground">Verify database connectivity</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestDb} disabled={testingDb}>
              {testingDb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Test
            </Button>
          </div>
          {dbStatus && (
            <div className={`rounded-lg p-3 text-sm ${dbStatus.success ? 'bg-green-50 text-green-800' : 'bg-destructive/10 text-destructive'}`}>
              {dbStatus.message}
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recalculate Stats</p>
              <p className="text-sm text-muted-foreground">Fix daily_stats from visitor data</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleFixStats} disabled={fixingStats}>
              {fixingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Fix Stats
            </Button>
          </div>
          {fixResult && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{fixResult}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Security and access information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Rate Limiting</span>
            <Badge>Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Track API Limit</span>
            <span className="text-sm text-muted-foreground">60 req/min per IP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Login Limit</span>
            <span className="text-sm text-muted-foreground">5 attempts/min per IP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Auth Method</span>
            <span className="text-sm text-muted-foreground">JWT (HTTP-only cookie)</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application</span>
            <span>Sangga Buana Visitor Counter</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span>Next.js 15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span>PostgreSQL</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
