'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Globe, RefreshCw, Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';

interface Website { id: string; name: string; domain: string; }
interface RealtimeActivity {
  session_id: string;
  page_url: string;
  page_title: string;
  browser: string;
  device_type: string;
  country: string;
  visit_time: string;
}

export default function RealtimeAnalyticsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [count, setCount] = useState(0);
  const [activity, setActivity] = useState<RealtimeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch('/api/websites').then(r => r.json()).then(d => {
      if (d.websites?.length) { setWebsites(d.websites); setSelectedWebsite(d.websites[0].id); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fetchRealtime = useCallback(async () => {
    if (!selectedWebsite) return;
    try {
      const [countRes, activityRes] = await Promise.all([
        fetch(`/api/realtime?websiteId=${selectedWebsite}`),
        fetch(`/api/realtime/activity?websiteId=${selectedWebsite}`).catch(() => null),
      ]);
      const countData = await countRes.json();
      setCount(countData.count || 0);
      if (activityRes) {
        const activityData = await activityRes.json();
        setActivity(activityData.visitors || []);
      }
    } catch { /* ignore */ }
  }, [selectedWebsite]);

  useEffect(() => { fetchRealtime(); }, [fetchRealtime]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRealtime();
    setRefreshing(false);
  };

  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
    if (type === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
    return <Monitor className="h-3.5 w-3.5" />;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Realtime</h1>
          <p className="text-muted-foreground">Live visitor activity (last 30 minutes)</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Website" /></SelectTrigger>
            <SelectContent>{websites.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Live count */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-700">Live Now</span>
            </div>
            <p className="text-5xl font-bold text-green-800">{count}</p>
            <p className="text-sm text-green-600 mt-1">active visitors</p>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getDeviceIcon(item.device_type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.page_title || item.page_url}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.page_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.country && <Badge variant="secondary" className="text-xs">{item.country}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.visit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
