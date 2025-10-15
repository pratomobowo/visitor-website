'use client';

import { useState, useEffect, useCallback } from 'react';
import VisitorChart from '@/components/VisitorChart';
import {
  GlobeAltIcon,
  UserGroupIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

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
    summary: {
      totalPageViews: number;
      uniqueVisitors: number;
      totalSessions: number;
      averageDuration: number;
      bounceRate: number;
    };
    timeSeries: Array<{
      date: string;
      pageViews: number;
      uniqueVisitors: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [period, setPeriod] = useState('week');

  const fetchAllTimeStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`/api/stats/all?period=${period}`);
      const data = await response.json();
      setAllTimeStats(data);
    } catch (error) {
      console.error('Error fetching all-time stats:', error);
      setAllTimeStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [period]);

  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      
      if (data.websites) {
        setWebsites(data.websites);
        
        // Fetch stats for each website
        if (data.websites.length > 0) {
          fetchStatsForWebsites(data.websites);
          fetchAllTimeStats();
        }
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllTimeStats]);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  useEffect(() => {
    fetchAllTimeStats();
  }, [fetchAllTimeStats]);

  const fetchStatsForWebsites = async (websites: Website[]) => {
    const statsPromises = websites.map(async (website) => {
      try {
        const response = await fetch(`/api/stats?websiteId=${website.id}&period=today`);
        const data = await response.json();
        
        return {
          id: website.id,
          todayVisitors: data.summary?.uniqueVisitors || 0,
          realtimeVisitors: Math.floor(Math.random() * 20), // Simulated realtime count
          todayPageViews: data.summary?.totalPageViews || 0,
          avgDuration: data.summary?.averageDuration || 0,
        };
      } catch (error) {
        console.error(`Error fetching stats for ${website.id}:`, error);
        return {
          id: website.id,
          todayVisitors: 0,
          realtimeVisitors: 0,
          todayPageViews: 0,
          avgDuration: 0,
        };
      }
    });

    const statsResults = await Promise.all(statsPromises);
    const statsMap = statsResults.reduce((acc, stat) => {
      acc[stat.id] = stat;
      return acc;
    }, {} as Record<string, WebsiteStats>);
    
    setWebsiteStats(statsMap);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor your website analytics and visitor statistics
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <CalendarDaysIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {websites.length > 0 && (
        <>
          {/* Overall Analytics Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Overall Analytics</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">All Websites</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Total Visitors</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Page Views</span>
                </div>
              </div>
            </div>
            {statsLoading ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : allTimeStats ? (
              <VisitorChart data={allTimeStats.timeSeries || []} />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>

          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allTimeStats?.summary?.uniqueVisitors?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Page Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allTimeStats?.summary?.totalPageViews?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allTimeStats ? formatDuration(allTimeStats.summary?.averageDuration || 0) : '0:00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <GlobeAltIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Websites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {websites.filter(w => w.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Websites Grid */}
      {websites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => {
            const stats = websiteStats[website.id];
            return (
              <div key={website.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <GlobeAltIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {website.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {website.domain}
                        </p>
                      </div>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${
                      website.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>

                  <div className="space-y-4">
                    {/* Realtime Visitors */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <EyeIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="ml-2 text-sm text-gray-600">Live Visitors</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats?.realtimeVisitors || 0}
                      </span>
                    </div>

                    {/* Today&apos;s Visitors */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="ml-2 text-sm text-gray-600">Today&apos;s Visitors</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats?.todayVisitors || 0}
                      </span>
                    </div>

                    {/* Today's Page Views */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <ChartBarIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="ml-2 text-sm text-gray-600">Page Views</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats?.todayPageViews || 0}
                      </span>
                    </div>

                    {/* Avg Duration */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                        </div>
                        <span className="ml-2 text-sm text-gray-600">Avg. Duration</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats ? formatDuration(stats.avgDuration) : '0:00'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Added {formatDate(website.created_at)}
                      </span>
                      <div className="flex space-x-2">
                        <a
                          href={`/dashboard/analytics?id=${website.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          Analytics
                        </a>
                        <span className="text-gray-300">|</span>
                        <a
                          href={`/dashboard/websites?id=${website.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          Manage
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <GlobeAltIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No websites yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your first website to track visitor analytics.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard/add-website"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Your First Website
            </a>
          </div>
        </div>
      )}
    </div>
  );
}