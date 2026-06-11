'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VisitorChart from '@/components/VisitorChart';
import Link from 'next/link';
import {
  Globe, Users, Eye, BarChart3, Clock, Plus,
} from 'lucide-react';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
}

interface WebsiteStats {
  id: string;
  todayVisitors: number;
  realtimeVisitors: number;
  todayPageViews: number;
  avgDuration: number;
}

export default function Dashboard() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [websiteStats, setWebsiteStats] = useState<Record<string, WebsiteStats>>({});
  const [allTimeStats, setAllTimeStats] = useState<{
    summary: { totalPageViews: number; uniqueVisitors: number; totalSessions: number; averageDuration: number; bounceRate: number };
    timeSeries: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [period, setPeriod] = useState('week');

  const fetchAllTimeStats = useCallback(async (currentPeriod: string) => {
    try {
      setStatsLoading(true);
      const response = await fetch(`/api/stats/all?period=${currentPeriod}`);
      const data = await response.json();
      setAllTimeStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setAllTimeStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchWebsites = useCallback(async (currentPeriod: string) => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      if (data.websites) {
        setWebsites(data.websites);
        if (data.websites.length > 0) {
          fetchStatsForWebsites(data.websites);
          fetchAllTimeStats(currentPeriod);
        }
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllTimeStats]);

  useEffect(() => {
    fetchWebsites(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchAllTimeStats(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchStatsForWebsites = async (sites: Website[]) => {
    const results = await Promise.all(sites.map(async (site) => {
      try {
        const [statsRes, realtimeRes] = await Promise.all([
          fetch(`/api/stats?websiteId=${site.id}&period=today`),
          fetch(`/api/realtime?websiteId=${site.id}`)
        ]);
        const stats = await statsRes.json();
        const realtime = await realtimeRes.json();
        return {
          id: site.id,
          todayVisitors: stats.summary?.uniqueVisitors || 0,
          realtimeVisitors: realtime.count || 0,
          todayPageViews: stats.summary?.totalPageViews || 0,
          avgDuration: stats.summary?.averageDuration || 0,
        };
      } catch {
        return { id: site.id, todayVisitors: 0, realtimeVisitors: 0, todayPageViews: 0, avgDuration: 0 };
      }
    }));
    setWebsiteStats(Object.fromEntries(results.map(s => [s.id, s])));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your website analytics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {websites.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-500/10 p-2.5">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Visitors</p>
                    <p className="text-2xl font-bold">{allTimeStats?.summary?.uniqueVisitors?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-500/10 p-2.5">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Page Views</p>
                    <p className="text-2xl font-bold">{allTimeStats?.summary?.totalPageViews?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-amber-500/10 p-2.5">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Duration</p>
                    <p className="text-2xl font-bold">{allTimeStats ? formatDuration(allTimeStats.summary?.averageDuration || 0) : '0:00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-purple-500/10 p-2.5">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Sites</p>
                    <p className="text-2xl font-bold">{websites.filter(w => w.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : allTimeStats?.timeSeries?.length ? (
                <VisitorChart data={allTimeStats.timeSeries} />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Websites Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((website) => {
              const stats = websiteStats[website.id];
              return (
                <Card key={website.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium leading-none">{website.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{website.domain}</p>
                        </div>
                      </div>
                      <Badge variant={website.is_active ? 'default' : 'secondary'} className="text-xs">
                        {website.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs text-muted-foreground">Live</span>
                        </div>
                        <p className="text-lg font-semibold">{stats?.realtimeVisitors || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Today</span>
                        </div>
                        <p className="text-lg font-semibold">{stats?.todayVisitors || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs text-muted-foreground">Views</span>
                        </div>
                        <p className="text-lg font-semibold">{stats?.todayPageViews || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-muted-foreground">Duration</span>
                        </div>
                        <p className="text-lg font-semibold">{stats ? formatDuration(stats.avgDuration) : '0:00'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/analytics/website?id=${website.id}`}>Analytics</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/websites?id=${website.id}`}>Manage</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No websites yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Get started by adding your first website to track visitor analytics.
            </p>
            <Button asChild>
              <Link href="/dashboard/add-website">
                <Plus className="h-4 w-4" />
                Add Website
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
