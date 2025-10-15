'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface TestResult {
  success: boolean;
  website: {
    id: string;
    name: string;
    domain: string;
    tracking_id: string;
    is_active: boolean;
  };
  tracking: {
    hasRecentActivity: boolean;
    hasTestActivity: boolean;
    recentVisitorCount: number;
    testVisitorCount: number;
    lastTestVisit: string | null;
    recentVisitors: Array<{
      page_url: string;
      page_title: string;
      visit_time: string;
      browser: string;
      os: string;
      device_type: string;
      is_test: boolean;
    }>;
  };
  testUrl: string;
  recommendations: Array<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    action: string;
  }>;
}

interface TrackingTestProps {
  websiteId: string;
  trackingId: string;
  domain: string;
  isActive: boolean;
}

export default function TrackingTest({ trackingId, domain }: TrackingTestProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingId,
          testUrl: `${domain}?test=true`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'desktop':
        return <ComputerDesktopIcon className="h-4 w-4" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tracking Connection Test</h3>
          <p className="text-sm text-gray-500">Test if your tracking script is working properly</p>
        </div>
        <button
          onClick={runTest}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Testing...
            </>
          ) : (
            <>
              <GlobeAltIcon className="-ml-1 mr-2 h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Test Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {testResult && (
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${testResult.tracking.hasRecentActivity ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {testResult.tracking.hasRecentActivity ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Recent Activity</p>
                  <p className="text-sm text-gray-500">
                    {testResult.tracking.recentVisitorCount} visitors
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${testResult.tracking.hasTestActivity ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center">
                {testResult.tracking.hasTestActivity ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Test Visits</p>
                  <p className="text-sm text-gray-500">
                    {testResult.tracking.testVisitorCount} detected
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${testResult.website.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {testResult.website.is_active ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Website Status</p>
                  <p className="text-sm text-gray-500">
                    {testResult.website.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {testResult.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Recommendations</h4>
              <div className="space-y-2">
                {testResult.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getStatusColor(rec.type)}`}>
                    <div className="flex items-start">
                      {getStatusIcon(rec.type)}
                      <div className="ml-3">
                        <p className="text-sm font-medium">{rec.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">How to Test Tracking</h4>
                <div className="mt-2 text-sm text-blue-800">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Visit your website at: <a href={testResult.testUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{testResult.testUrl}</a></li>
                    <li>Look for blue notification pop-ups indicating successful tracking</li>
                    <li>Use the test controls to manually trigger tracking events</li>
                    <li>Come back here and click &quot;Run Test&quot; to verify the data was received</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Visitors */}
          {testResult.tracking.recentVisitors.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Recent Visitor Activity</h4>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Browser
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testResult.tracking.recentVisitors.map((visitor, index) => (
                      <tr key={index} className={visitor.is_test ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{visitor.page_title}</div>
                            <div className="text-gray-500 truncate max-w-xs">{visitor.page_url}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {getDeviceIcon(visitor.device_type)}
                            <span className="ml-2">{visitor.device_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.browser}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatTime(visitor.visit_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {visitor.is_test ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Test
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Live
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}