'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VisitorChart from '@/components/VisitorChart';
import { BarChart3, Users, Clock, Loader2 } from 'lucide-react';

interface Website { id: string; name: string; domain: string; }
interface MonthData {
  month: number;
  monthName: string;
  pageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  averageDuration: number;
  bounceRate: number;
}

export default function MonthlyAnalyticsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<{ monthlyData: MonthData[]; summary: { totalPageViews: number; uniqueVisitors: number; averageDuration: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    fetch('/api/websites').then(r => r.json()).then(d => {
      if (d.websites?.length) { setWebsites(d.websites); setSelectedWebsite(d.websites[0].id); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedWebsite) return;
    fetch(`/api/stats/monthly?websiteId=${selectedWebsite}&year=${year}`)
      .then(r => r.json()).then(setData).catch(() => setData(null));
  }, [selectedWebsite, year]);

  const chartData = data?.monthlyData?.filter(m => m.pageViews > 0).map(m => ({
    date: `${year}-${String(m.month).padStart(2, '0')}`,
    pageViews: m.pageViews,
    uniqueVisitors: m.uniqueVisitors,
  })) || [];

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monthly Analytics</h1>
          <p className="text-muted-foreground">Month-by-month performance overview</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Website" /></SelectTrigger>
            <SelectContent>{websites.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {data?.summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-blue-500/10 p-2"><Users className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Total Visitors ({year})</p><p className="text-xl font-bold">{data.summary.uniqueVisitors.toLocaleString()}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-purple-500/10 p-2"><BarChart3 className="h-4 w-4 text-purple-600" /></div><div><p className="text-xs text-muted-foreground">Total Page Views</p><p className="text-xl font-bold">{data.summary.totalPageViews.toLocaleString()}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-amber-500/10 p-2"><Clock className="h-4 w-4 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">Avg Duration</p><p className="text-xl font-bold">{formatDuration(data.summary.averageDuration)}</p></div></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Monthly Trend — {year}</CardTitle></CardHeader>
        <CardContent>
          {chartData.length > 0 ? <VisitorChart data={chartData} /> : <p className="text-center text-muted-foreground py-12">No data for {year}</p>}
        </CardContent>
      </Card>

      {data?.monthlyData && data.monthlyData.some(m => m.pageViews > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 font-medium">Month</th><th className="text-right py-2 font-medium">Visitors</th><th className="text-right py-2 font-medium">Page Views</th><th className="text-right py-2 font-medium">Avg Duration</th><th className="text-right py-2 font-medium">Bounce</th></tr></thead>
                <tbody>
                  {data.monthlyData.filter(m => m.pageViews > 0).map(m => (
                    <tr key={m.month} className="border-b last:border-0">
                      <td className="py-2">{m.monthName}</td>
                      <td className="text-right py-2 text-muted-foreground">{m.uniqueVisitors.toLocaleString()}</td>
                      <td className="text-right py-2 text-muted-foreground">{m.pageViews.toLocaleString()}</td>
                      <td className="text-right py-2 text-muted-foreground">{formatDuration(m.averageDuration)}</td>
                      <td className="text-right py-2 text-muted-foreground">{m.bounceRate}%</td>
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
