'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import VisitorChart from '@/components/VisitorChart';
import { Globe, Users, BarChart3, Clock, Eye, Monitor, Smartphone, Tablet, Loader2 } from 'lucide-react';

interface Website { id: string; name: string; domain: string; tracking_id: string; is_active: boolean; }
interface Stats {
  summary: { totalPageViews: number; uniqueVisitors: number; totalSessions: number; averageDuration: number; bounceRate: number };
  timeSeries: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  topPages: Array<{ url: string; title: string; count: number }>;
  deviceStats: { devices: Record<string, number>; browsers: Record<string, number>; os: Record<string, number> };
  referrerStats: Record<string, number>;
}

export default function WebsiteAnalyticsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState('today');
  const [realtimeVisitors, setRealtimeVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const searchParams = useSearchParams();

  const fetchWebsites = useCallback(async () => {
    try {
      const res = await fetch('/api/websites');
      const data = await res.json();
      if (data.websites) {
        setWebsites(data.websites);
        const id = searchParams.get('id');
        if (id) {
          const site = data.websites.find((w: Website) => w.id === id);
          if (site) setSelectedWebsite(site);
        } else if (data.websites.length > 0) {
          setSelectedWebsite(data.websites[0]);
        }
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [searchParams]);

  const fetchStats = useCallback(async () => {
    if (!selectedWebsite) return;
    try {
      const p = showCustom && customStart && customEnd ? `custom:${customStart}:${customEnd}` : period;
      const [statsRes, realtimeRes] = await Promise.all([
        fetch(`/api/stats?websiteId=${selectedWebsite.id}&period=${p}`),
        fetch(`/api/realtime?websiteId=${selectedWebsite.id}`),
      ]);
      const statsData = await statsRes.json();
      const realtimeData = await realtimeRes.json();
      setStats(statsData);
      setRealtimeVisitors(realtimeData.count || 0);
    } catch { /* ignore */ }
  }, [selectedWebsite, period, showCustom, customStart, customEnd]);

  useEffect(() => { fetchWebsites(); }, [fetchWebsites]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (type === 'tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Analytics</h1>
          <p className="text-muted-foreground">Detailed analytics per website</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedWebsite?.id || ''} onValueChange={(v) => setSelectedWebsite(websites.find(w => w.id === v) || null)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select website" /></SelectTrigger>
            <SelectContent>
              {websites.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => { setPeriod(v); setShowCustom(v === 'custom'); }}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showCustom && (
        <Card>
          <CardContent className="flex gap-4 items-end p-4">
            <div className="space-y-1"><Label>Start</Label><Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /></div>
            <div className="space-y-1"><Label>End</Label><Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></div>
            <Button size="sm" onClick={fetchStats}>Apply</Button>
          </CardContent>
        </Card>
      )}

      {selectedWebsite && stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-green-500/10 p-2"><Eye className="h-4 w-4 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Realtime</p><p className="text-xl font-bold">{realtimeVisitors}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-blue-500/10 p-2"><Users className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Visitors</p><p className="text-xl font-bold">{stats.summary.uniqueVisitors.toLocaleString()}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-purple-500/10 p-2"><BarChart3 className="h-4 w-4 text-purple-600" /></div><div><p className="text-xs text-muted-foreground">Page Views</p><p className="text-xl font-bold">{stats.summary.totalPageViews.toLocaleString()}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-amber-500/10 p-2"><Clock className="h-4 w-4 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">Avg Duration</p><p className="text-xl font-bold">{formatDuration(stats.summary.averageDuration)}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-red-500/10 p-2"><Globe className="h-4 w-4 text-red-600" /></div><div><p className="text-xs text-muted-foreground">Bounce Rate</p><p className="text-xl font-bold">{stats.summary.bounceRate}%</p></div></CardContent></Card>
          </div>

          {/* Chart */}
          <Card><CardHeader><CardTitle>Visitors Over Time</CardTitle></CardHeader><CardContent>{stats.timeSeries.length > 0 ? <VisitorChart data={stats.timeSeries} /> : <p className="text-center text-muted-foreground py-12">No data</p>}</CardContent></Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Pages */}
            <Card><CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader><CardContent><div className="space-y-2">{stats.topPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm"><span className="truncate flex-1 text-muted-foreground">{p.title || p.url}</span><Badge variant="secondary">{p.count}</Badge></div>
            ))}{stats.topPages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}</div></CardContent></Card>

            {/* Device Stats */}
            <Card><CardHeader><CardTitle className="text-base">Devices</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(stats.deviceStats.devices).map(([device, count]) => {
              const total = Object.values(stats.deviceStats.devices).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={device} className="flex items-center gap-3">
                  {getDeviceIcon(device)}
                  <span className="text-sm capitalize flex-1">{device}</span>
                  <span className="text-sm text-muted-foreground">{pct}%</span>
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}</div></CardContent></Card>

            {/* Referrers */}
            <Card><CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader><CardContent><div className="space-y-2">{Object.entries(stats.referrerStats).sort(([,a],[,b]) => b - a).slice(0, 8).map(([ref, count]) => (
              <div key={ref} className="flex items-center justify-between text-sm"><span className="truncate flex-1 text-muted-foreground">{ref === 'direct' ? 'Direct' : ref.replace('https://www.', '')}</span><Badge variant="secondary">{count}</Badge></div>
            ))}{Object.keys(stats.referrerStats).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}</div></CardContent></Card>

            {/* Browsers */}
            <Card><CardHeader><CardTitle className="text-base">Browsers</CardTitle></CardHeader><CardContent><div className="space-y-2">{Object.entries(stats.deviceStats.browsers).sort(([,a],[,b]) => b - a).map(([browser, count]) => {
              const total = Object.values(stats.deviceStats.browsers).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={browser} className="flex items-center justify-between text-sm"><span className="flex-1">{browser}</span><span className="text-muted-foreground">{pct}%</span></div>
              );
            })}</div></CardContent></Card>
          </div>
        </>
      ) : (
        <Card><CardContent className="flex flex-col items-center py-16"><Globe className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-muted-foreground">Select a website to view analytics</p></CardContent></Card>
      )}
    </div>
  );
}
