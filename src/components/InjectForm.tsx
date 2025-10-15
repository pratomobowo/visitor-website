'use client';

import { useState } from 'react';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface InjectFormProps {
  websiteId: string;
  websiteName: string;
  onInjectComplete: () => void;
}

export default function InjectForm({ websiteId, websiteName, onInjectComplete }: InjectFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitorCount: 100,
    dateRange: 'today',
    distribution: 'even'
  });
  const [injecting, setInjecting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    setInjecting(true);
    setResult(null);

    try {
      const response = await fetch('/api/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId,
          ...formData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: data.message
        });
        onInjectComplete();
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to inject data'
        });
      }
    } catch {
      setResult({
        success: false,
        message: 'An error occurred while injecting data'
      });
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BeakerIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Data Injection</h3>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            {isOpen ? (
              <>
                Hide
                <ChevronUpIcon className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Show
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 py-5 sm:px-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Test Data Only
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This feature generates fake visitor data for testing purposes only. 
                    All injected data will be marked as fake and can be filtered out if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleInject} className="space-y-4">
            <div>
              <label htmlFor="visitorCount" className="block text-sm font-medium text-gray-700">
                Number of Visitors
              </label>
              <input
                type="number"
                id="visitorCount"
                min="1"
                max="10000"
                value={formData.visitorCount}
                onChange={(e) => setFormData({ ...formData, visitorCount: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Generate between 1 and 10,000 fake visitors
              </p>
            </div>

            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <select
                id="dateRange"
                value={formData.dateRange}
                onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label htmlFor="distribution" className="block text-sm font-medium text-gray-700">
                Time Distribution
              </label>
              <select
                id="distribution"
                value={formData.distribution}
                onChange={(e) => setFormData({ ...formData, distribution: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
              >
                <option value="even">Even Distribution</option>
                <option value="peak">Business Hours (9 AM - 5 PM)</option>
                <option value="random">Random</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How visitors should be distributed across the time period
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Target: <span className="font-medium text-gray-900">{websiteName}</span>
              </div>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={injecting}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-all duration-200"
                >
                  {injecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Injecting...
                    </>
                  ) : (
                    <>
                      <BeakerIcon className="h-4 w-4 mr-1" />
                      Inject Fake Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}