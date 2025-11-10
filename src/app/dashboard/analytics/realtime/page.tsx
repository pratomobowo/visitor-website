'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GlobeAltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  Square3Stack3DIcon,
  PauseIcon,
  PlayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
}

interface Activity {
  id: string;
  sessionId: string;
  pageUrl: string;
  pageTitle: string;
  visitTime: string;
  duration: number;
  browser: string;
  os: string;
  deviceType: string;
  country: string;
}

interface RealtimeStats {
  count: number;
  activities: Activity[];
}

const REFRESH_INTERVAL = 5000; // 5 seconds

export default function RealtimeAnalyticsPage() {
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [realtimeCount, setRealtimeCount] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const searchParams = useSearchParams();

  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();

      if (data.websites) {
        setWebsites(data.websites);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  }, []);

  const fetchWebsite = useCallback(async (id: string) => {
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
  }, []);

  const fetchRealtimeData = useCallback(async () => {
    if (!selectedWebsite) return;

    try {
      // Fetch count
      const countResponse = await fetch(`/api/realtime?websiteId=${selectedWebsite.id}`);
      const countData = await countResponse.json();
      setRealtimeCount(countData.count || 0);

      // Fetch activities
      const activitiesResponse = await fetch(
        `/api/realtime/activity?websiteId=${selectedWebsite.id}&limit=20`
      );
      const activitiesData = (await activitiesResponse.json()) as RealtimeStats;
      setActivities(activitiesData.activities || []);
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    }
  }, [selectedWebsite]);

  useEffect(() => {
    const websiteId = searchParams.get('id');
    if (websiteId) {
      fetchWebsite(websiteId);
    }
    fetchWebsites();
  }, [searchParams, fetchWebsite, fetchWebsites]);

  // Fetch data on mount and when website changes
  useEffect(() => {
    if (selectedWebsite) {
      fetchRealtimeData();
    }
  }, [selectedWebsite, fetchRealtimeData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!isAutoRefresh || !selectedWebsite) return;

    const interval = setInterval(() => {
      fetchRealtimeData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAutoRefresh, selectedWebsite, fetchRealtimeData]);

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 1) return '< 1s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Realtime Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live monitoring of current website visitors
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

      {/* Main Content */}
      {selectedWebsite ? (
        <>
          {/* Live Visitor Counter */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">Active Visitors (Last 30 min)</p>
                <p className="mt-2 text-5xl font-bold">{realtimeCount}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 mb-4">
                  <button
                    onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                      isAutoRefresh
                        ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
                        : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                    }`}
                  >
                    {isAutoRefresh ? (
                      <>
                        <PauseIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Pause</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Resume</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fetchRealtimeData()}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-all"
                  >
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-medium">Refresh</span>
                  </button>
                </div>
                <div className="flex items-center justify-end space-x-2 text-sm text-indigo-100">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span>{isAutoRefresh ? 'Updating every 5s' : 'Manual mode'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Live Activity Feed</h3>
                <span className="text-sm text-gray-500">{activities.length} recent visitors</span>
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      {/* Time indicator */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100">
                          <ClockIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>

                      {/* Activity details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.pageTitle || activity.pageUrl}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {activity.pageUrl}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex items-center space-x-2 text-xs text-gray-500">
                            <span className="font-medium">{formatTime(activity.visitTime)}</span>
                          </div>
                        </div>

                        {/* Device and Browser info */}
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                          <div className="inline-flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                            {getDeviceIcon(activity.deviceType)}
                            <span className="text-gray-700 capitalize">{activity.deviceType}</span>
                          </div>
                          <div className="inline-flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                            <span className="text-gray-700">{activity.browser}</span>
                          </div>
                          <div className="inline-flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                            <span className="text-gray-700">{activity.os}</span>
                          </div>
                          {activity.country !== 'Unknown' && (
                            <div className="inline-flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                              <GlobeAltIcon className="h-3 w-3 text-gray-600" />
                              <span className="text-gray-700">{activity.country}</span>
                            </div>
                          )}
                          <div className="inline-flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs ml-auto">
                            <span className="text-gray-700 font-medium">{formatDuration(activity.duration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No visitors in the last 30 minutes
                </p>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500 text-sm font-medium">Current Sessions</p>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{realtimeCount}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500 text-sm font-medium">Recent Visitors</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{activities.length}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500 text-sm font-medium">Avg Session Time</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {activities.length > 0
                  ? formatDuration(
                      Math.round(
                        activities.reduce((sum, a) => sum + a.duration, 0) / activities.length
                      )
                    )
                  : '-'}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500 text-sm font-medium">Update Interval</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {isAutoRefresh ? '5s' : 'Manual'}
              </p>
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
            Select a website from the dropdown above to view realtime analytics.
          </p>
        </div>
      )}
    </div>
  );
}
