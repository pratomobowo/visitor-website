'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import StatsCard from '@/components/StatsCard';
import VisitorChart from '@/components/VisitorChart';
import {
  GlobeAltIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  Square3Stack3DIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
}

interface Stats {
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
  topPages: Array<{
    url: string;
    title: string;
    count: number;
  }>;
  deviceStats: {
    devices: Record<string, number>;
    browsers: Record<string, number>;
    os: Record<string, number>;
  };
  referrerStats: Record<string, number>;
}

export default function AnalyticsPage() {
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState('today');
  const [realtimeVisitors, setRealtimeVisitors] = useState(0);
  const [showCustomDateFilter, setShowCustomDateFilter] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const searchParams = useSearchParams();

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      
      if (data.websites) {
        setWebsites(data.websites);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const fetchWebsite = async (id: string) => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      
      if (data.websites) {
        const website = data.websites.find((w: { id: string }) => w.id === id);
        if (website) {
          setSelectedWebsite(website);
        }
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  };

  const fetchStats = useCallback(async () => {
    if (!selectedWebsite) return;

    try {
      const response = await fetch(`/api/stats?websiteId=${selectedWebsite.id}&period=${period}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [selectedWebsite, period]);

  const fetchRealtimeVisitors = useCallback(async () => {
    if (!selectedWebsite) return;

    try {
      const response = await fetch(`/api/realtime?websiteId=${selectedWebsite.id}`);
      const data = await response.json();
      setRealtimeVisitors(data.count || 0);
    } catch (error) {
      console.error('Error fetching realtime visitors:', error);
      setRealtimeVisitors(0);
    }
  }, [selectedWebsite]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!selectedWebsite) return;
    
    // Initial fetch
    fetchRealtimeVisitors();
    
    // Set up interval to update every 30 seconds
    const interval = setInterval(fetchRealtimeVisitors, 30000);
    
    return () => {
      clearInterval(interval);
      console.log('Real-time subscription cleanup');
    };
  }, [selectedWebsite, fetchRealtimeVisitors]);

  useEffect(() => {
    const websiteId = searchParams.get('id');
    if (websiteId) {
      fetchWebsite(websiteId);
    }
    fetchWebsites();
  }, [searchParams]);

  useEffect(() => {
    if (selectedWebsite) {
      fetchStats();
      setupRealtimeSubscription();
    }
  }, [selectedWebsite, period, fetchStats, setupRealtimeSubscription]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop':
        return <ComputerDesktopIcon className="h-4 w-4 text-blue-600" />;
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-4 w-4 text-green-600" />;
      case 'tablet':
        return <Square3Stack3DIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    if (newPeriod === 'custom') {
      setShowCustomDateFilter(true);
    } else {
      setShowCustomDateFilter(false);
      setPeriod(newPeriod);
    }
  };

  const applyCustomDateFilter = () => {
    if (customStartDate && customEndDate) {
      // Convert to YYYY-MM-DD format for API
      const startDate = new Date(customStartDate).toISOString().split('T')[0];
      const endDate = new Date(customEndDate).toISOString().split('T')[0];
      
      // Set a custom period identifier
      setPeriod(`custom:${startDate}:${endDate}`);
      setShowCustomDateFilter(false);
    }
  };

  const clearCustomDateFilter = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDateFilter(false);
    setPeriod('today');
  };

  const getPeriodDisplayText = () => {
    if (period.startsWith('custom:')) {
      const [, startDate, endDate] = period.split(':');
      return `${startDate} - ${endDate}`;
    }
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Detailed analytics and visitor insights for your websites
          </p>
        </div>
      </div>

      {/* Website Selector */}
      <div className="px-6">
        {websites.length > 0 ? (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-gray-700">Website:</span>
            {websites.map((website) => (
              <button
                key={website.id}
                onClick={() => setSelectedWebsite(website)}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedWebsite?.id === website.id
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  website.is_active ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                {website.name}
                {selectedWebsite?.id === website.id && (
                  <CheckCircleIcon className="h-4 w-4 ml-2 text-indigo-500" />
                )}
              </button>
            ))}
            <a
              href="/dashboard/add-website"
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all duration-200"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </a>
          </div>
        ) : (
          <div className="text-center py-8">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No websites yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first website to start tracking analytics.
            </p>
            <div className="mt-4">
              <a
                href="/dashboard/add-website"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Website
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Full Width */}
      {selectedWebsite ? (
        <>
          {/* Website Header with Active Visitors and Date Filter */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedWebsite.name || 'Selected Website'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedWebsite.domain || 'Website domain'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">
                    {realtimeVisitors} active visitors
                  </span>
                </div>
                <div className="relative">
                  {showCustomDateFilter ? (
                    <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-2 shadow-lg">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Start date"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="End date"
                      />
                      <button
                        onClick={applyCustomDateFilter}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        Apply
                      </button>
                      <button
                        onClick={clearCustomDateFilter}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <select
                        value={period}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <CalendarDaysIcon className="h-5 w-5" />
                      </div>
                      
                      {period.startsWith('custom:') && (
                        <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>{getPeriodDisplayText()}</span>
                          <button
                            onClick={() => setPeriod('today')}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <a
                  href={`/dashboard/websites?id=${selectedWebsite.id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium whitespace-nowrap"
                >
                  Manage →
                </a>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Page Views"
              value={stats?.summary.totalPageViews.toLocaleString() || '0'}
              icon={<ChartBarIcon className="h-6 w-6 text-indigo-500" />}
              change={12}
              changeType="percentage"
            />
            <StatsCard
              title="Unique Visitors"
              value={stats?.summary.uniqueVisitors.toLocaleString() || '0'}
              icon={<UserGroupIcon className="h-6 w-6 text-green-500" />}
              change={8}
              changeType="percentage"
            />
            <StatsCard
              title="Avg. Duration"
              value={stats ? formatDuration(stats.summary.averageDuration) : '0:00'}
              icon={<ClockIcon className="h-6 w-6 text-yellow-500" />}
              change={-5}
              changeType="seconds"
            />
            <StatsCard
              title="Bounce Rate"
              value={`${stats?.summary.bounceRate || 0}%`}
              icon={<GlobeAltIcon className="h-6 w-6 text-red-500" />}
              change={-3}
              changeType="percentage"
            />
          </div>

          {/* Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Visitor Trends</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Last 24 hours</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Page Views</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Unique Visitors</span>
                </div>
              </div>
            </div>
            {stats ? (
              <VisitorChart data={stats.timeSeries} />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Top Pages</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {stats?.topPages.slice(0, 10).map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {page.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {page.url}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{page.count}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Device Breakdown</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {stats?.deviceStats.devices && Object.entries(stats.deviceStats.devices).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        device === 'desktop' ? 'bg-blue-100' :
                        device === 'mobile' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {getDeviceIcon(device)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {device}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">
                        {stats && Math.round((count / stats.summary.totalPageViews) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Browser Statistics</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {stats?.deviceStats.browsers && Object.entries(stats.deviceStats.browsers).slice(0, 5).map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {browser.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {browser}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">
                        {stats && Math.round((count / stats.summary.totalPageViews) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referrer Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Traffic Sources</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {stats?.referrerStats && Object.entries(stats.referrerStats).slice(0, 5).map(([referrer, count]) => (
                  <div key={referrer} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {referrer === 'direct' ? 'D' : referrer.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {referrer === 'direct' ? 'Direct Traffic' : referrer}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">
                        {stats && Math.round((count / stats.summary.totalPageViews) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <ChartBarIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No website selected</h3>
          <p className="mt-2 text-sm text-gray-500">
            Select a website from the dropdown above to view detailed analytics.
          </p>
        </div>
      )}
    </div>
  );
}