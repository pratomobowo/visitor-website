'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  Globe, Trash2, Copy, Check, Code, Plus, Loader2, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
}

export default function WebsitesPage() {
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [widgetLabel, setWidgetLabel] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && websites.length > 0) {
      const site = websites.find(w => w.id === id);
      if (site) setSelectedWebsite(site);
    }
  }, [searchParams, websites]);

  useEffect(() => {
    if (selectedWebsite) setWidgetLabel(selectedWebsite.name);
  }, [selectedWebsite]);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      if (data.websites) setWebsites(data.websites);
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this website? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/websites?id=${id}`, { method: 'DELETE' });
      await fetchWebsites();
      if (selectedWebsite?.id === id) setSelectedWebsite(null);
    } catch {
      alert('Failed to delete website');
    } finally {
      setDeleting(null);
    }
  };

  const getTrackingCode = (trackingId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `<script>\n  (function() {\n    var s = document.createElement('script');\n    s.src = '${baseUrl}/api/script/${trackingId}';\n    s.async = true;\n    document.head.appendChild(s);\n  })();\n</script>`;
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">Manage your tracked websites</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/add-website"><Plus className="h-4 w-4" />Add Website</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-2">
          {websites.map((site) => (
            <Card
              key={site.id}
              className={cn(
                "cursor-pointer transition-colors",
                selectedWebsite?.id === site.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedWebsite(site)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{site.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{site.domain}</p>
                    <Badge variant={site.is_active ? 'default' : 'secondary'} className="mt-2 text-xs">
                      {site.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(site.id); }}
                    disabled={deleting === site.id}
                  >
                    {deleting === site.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {websites.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-8">
                <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No websites yet</p>
                <Button size="sm" asChild className="mt-3">
                  <Link href="/dashboard/add-website"><Plus className="h-4 w-4" />Add Website</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedWebsite ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedWebsite.name}</CardTitle>
                      <CardDescription>{selectedWebsite.domain}</CardDescription>
                    </div>
                    <Badge variant={selectedWebsite.is_active ? 'default' : 'secondary'}>
                      {selectedWebsite.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Tracking ID:</span>
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">{selectedWebsite.tracking_id}</code>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/dashboard/analytics/website?id=${selectedWebsite.id}`}>
                        <ExternalLink className="h-4 w-4" />View Analytics
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyCode(getTrackingCode(selectedWebsite.tracking_id))}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Code className="h-4 w-4" />
                    Tracking Code
                  </CardTitle>
                  <CardDescription>Add this to your website&apos;s HTML head section</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="rounded-lg bg-zinc-950 p-4 text-xs text-green-400 overflow-x-auto">
                      {getTrackingCode(selectedWebsite.tracking_id)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-zinc-400 hover:text-white"
                      onClick={() => copyCode(getTrackingCode(selectedWebsite.tracking_id))}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Widget Embed</CardTitle>
                  <CardDescription>Embed a visitor counter widget on your site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Widget Label</Label>
                    <Input
                      value={widgetLabel}
                      onChange={(e) => setWidgetLabel(e.target.value)}
                      placeholder="Visitor Counter"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Embed Code</Label>
                    <pre className="rounded-lg bg-zinc-950 p-3 text-xs text-green-400 overflow-x-auto">
                      {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/${selectedWebsite.tracking_id}?label=${encodeURIComponent(widgetLabel || 'Visitor Counter')}" width="332" height="350" frameborder="0" style="border:none;border-radius:16px;"></iframe>`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">No website selected</p>
                <p className="text-sm text-muted-foreground">Select a website from the list</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
