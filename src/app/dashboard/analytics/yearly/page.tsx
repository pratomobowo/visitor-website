'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VisitorChart from '@/components/VisitorChart';
import { BarChart3, Users, TrendingUp, Loader2 } from 'lucide-react';

interface Website { id: string; name: string; domain: string; }

export default function YearlyAnalyticsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [data, setData] = useState<{ years: Array<{ year: number; pageViews: number; uniqueVisitors: number; avgDuration: number }> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/websites').then(r => r.json()).then(d => {
      if (d.websites?.length) { setWebsites(d.websites); setSelectedWebsite(d.websites[0].id); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedWebsite) return;
    fetch(`/api/stats/yearly?websiteId=${selectedWebsite}`)
      .then(r => r.json()).then(setData).catch(() => setData(null));
  }, [selectedWebsite]);

  const chartData = data?.years?.map(y => ({
    date: y.year.toString(),
    pageViews: y.pageViews,
    uniqueVisitors: y.uniqueVisitors,
  })) || [];

  const totalVisitors = data?.years?.reduce((sum, y) => sum + y.uniqueVisitors, 0) || 0;
  const totalViews = data?.years?.reduce((sum, y) => sum + y.pageViews, 0) || 0;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yearly Analytics</h1>
          <p className="text-muted-foreground">Year-over-year performance comparison</p>
        </div>
        <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Website" /></SelectTrigger>
          <SelectContent>{websites.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-blue-500/10 p-2"><Users className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">All-time Visitors</p><p className="text-xl font-bold">{totalVisitors.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-purple-500/10 p-2"><BarChart3 className="h-4 w-4 text-purple-600" /></div><div><p className="text-xs text-muted-foreground">All-time Views</p><p className="text-xl font-bold">{totalViews.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-green-500/10 p-2"><TrendingUp className="h-4 w-4 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Years Tracked</p><p className="text-xl font-bold">{data?.years?.length || 0}</p></div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Yearly Overview</CardTitle></CardHeader><CardContent>{chartData.length > 0 ? <VisitorChart data={chartData} /> : <p className="text-center text-muted-foreground py-12">No data available</p>}</CardContent></Card>

      {data?.years && data.years.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Year-by-Year Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 font-medium">Year</th><th className="text-right py-2 font-medium">Visitors</th><th className="text-right py-2 font-medium">Page Views</th><th className="text-right py-2 font-medium">Avg Duration</th></tr></thead>
                <tbody>
                  {data.years.map(y => (
                    <tr key={y.year} className="border-b last:border-0">
                      <td className="py-2 font-medium">{y.year}</td>
                      <td className="text-right py-2 text-muted-foreground">{y.uniqueVisitors.toLocaleString()}</td>
                      <td className="text-right py-2 text-muted-foreground">{y.pageViews.toLocaleString()}</td>
                      <td className="text-right py-2 text-muted-foreground">{Math.floor(y.avgDuration / 60)}:{(y.avgDuration % 60).toString().padStart(2, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
