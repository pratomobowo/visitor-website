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
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
}

interface YearlyStats {
  year: number;
  pageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  averageDuration: number;
  bounceRate: number;
  growthRate: number;
}

interface Stats {
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalSessions: number;
    averageDuration: number;
    bounceRate: number;
  };
  yearlyData: YearlyStats[];
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

export default function YearlyAnalyticsPage() {
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [fromYear, setFromYear] = useState((new Date().getFullYear() - 4).toString());
  const [toYear, setToYear] = useState(new Date().getFullYear().toString());
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

  const fetchStats = useCallback(async () => {
    if (!selectedWebsite) return;

    try {
      const response = await fetch(
        `/api/stats/yearly?websiteId=${selectedWebsite.id}&fromYear=${fromYear}&toYear=${toYear}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [selectedWebsite, fromYear, toYear]);

  useEffect(() => {
    const websiteId = searchParams.get('id');
    if (websiteId) {
      fetchWebsite(websiteId);
    }
    fetchWebsites();
  }, [searchParams, fetchWebsite, fetchWebsites]);

  useEffect(() => {
    if (selectedWebsite) {
      fetchStats();
    }
  }, [selectedWebsite, fromYear, toYear, fetchStats]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get available years (current year - 10 years back)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 11 }, (_, i) => currentYear - i);

  // Convert yearly data to chart format
  const chartData = (stats?.yearlyData || [])
    .sort((a, b) => a.year - b.year)
    .map((year) => ({
      date: year.year.toString(),
      pageViews: year.pageViews,
      uniqueVisitors: year.uniqueVisitors,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yearly Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Year-over-year visitor insights for your websites
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
          {/* Header with Year Range Selector */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedWebsite.name || 'Selected Website'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedWebsite.domain || 'Website domain'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <select
                    value={fromYear}
                    onChange={(e) => {
                      const newFromYear = parseInt(e.target.value, 10);
                      if (newFromYear <= parseInt(toYear, 10)) {
                        setFromYear(e.target.value);
                      }
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    {availableYears.map((year) => (
                      <option key={`from-${year}`} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <select
                    value={toYear}
                    onChange={(e) => {
                      const newToYear = parseInt(e.target.value, 10);
                      if (newToYear >= parseInt(fromYear, 10)) {
                        setToYear(e.target.value);
                      }
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    {availableYears.map((year) => (
                      <option key={`to-${year}`} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Overall Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Page Views"
              value={stats?.summary.totalPageViews.toLocaleString() || '0'}
              icon={<ChartBarIcon className="h-6 w-6 text-indigo-500" />}
            />
            <StatsCard
              title="Total Visitors"
              value={stats?.summary.uniqueVisitors.toLocaleString() || '0'}
              icon={<UserGroupIcon className="h-6 w-6 text-green-500" />}
            />
            <StatsCard
              title="Avg. Duration"
              value={stats ? formatDuration(stats.summary.averageDuration) : '0:00'}
              icon={<ClockIcon className="h-6 w-6 text-yellow-500" />}
            />
            <StatsCard
              title="Bounce Rate"
              value={`${stats?.summary.bounceRate || 0}%`}
              icon={<GlobeAltIcon className="h-6 w-6 text-red-500" />}
            />
          </div>

          {/* Yearly Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Yearly Trends</h3>
              <div className="flex items-center space-x-2">
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
            {stats && chartData.length > 0 ? (
              <VisitorChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data available for this year range</p>
              </div>
            )}
          </div>

          {/* Yearly Breakdown Table */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Yearly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Visitors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bounce Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.yearlyData.map((year) => (
                    <tr key={year.year} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{year.pageViews.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{year.uniqueVisitors.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{year.totalSessions.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDuration(year.averageDuration)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{year.bounceRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {year.growthRate !== 0 ? (
                          <div className="flex items-center space-x-1">
                            {year.growthRate > 0 ? (
                              <>
                                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">+{year.growthRate}%</span>
                              </>
                            ) : (
                              <>
                                <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                                <span className="text-red-600">{year.growthRate}%</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            Select a website from the dropdown above to view yearly analytics.
          </p>
        </div>
      )}
    </div>
  );
}
