'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TrackingTest from '@/components/TrackingTest';
import {
  GlobeAltIcon,
  ChartBarIcon,
  TrashIcon,
  ArrowRightIcon,
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

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

  // Widget embed state
  const [widgetLabel, setWidgetLabel] = useState('');
  const [embedCopied, setEmbedCopied] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const websiteId = searchParams.get('id');
    if (websiteId) {
      fetchWebsite(websiteId);
    }
    fetchWebsites();
  }, [searchParams]);

  // Reset widget label when website changes
  useEffect(() => {
    if (selectedWebsite) {
      setWidgetLabel(selectedWebsite.name);
    }
  }, [selectedWebsite]);

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

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      return;
    }

    setDeleting(websiteId);
    try {
      const response = await fetch(`/api/websites?id=${websiteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete website');
      }

      // Refresh websites list
      await fetchWebsites();

      // If the deleted website was selected, clear selection
      if (selectedWebsite?.id === websiteId) {
        setSelectedWebsite(null);
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      alert('Failed to delete website. Please try again.');
    } finally {
      setDeleting(null);
    }
  };


  const getTrackingCode = (trackingId: string) => {
    const baseUrl = window.location.origin;
    return `<!-- Sangga Buana Analytics -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/api/script/${trackingId}';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const getWidgetEmbedCode = (trackingId: string) => {
    const baseUrl = window.location.origin;
    const encodedLabel = encodeURIComponent(widgetLabel || 'Visitor Counter');
    return `<iframe 
  src="${baseUrl}/widget/${trackingId}?label=${encodedLabel}" 
  width="332" 
  height="350" 
  frameborder="0"
  style="border:none; border-radius:16px;"
></iframe>`;
  };

  const getWidgetPreviewUrl = (trackingId: string) => {
    const encodedLabel = encodeURIComponent(widgetLabel || 'Visitor Counter');
    return `/widget/${trackingId}?label=${encodedLabel}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Tracking code copied to clipboard!');
    });
  };

  const copyWidgetEmbed = () => {
    if (selectedWebsite) {
      navigator.clipboard.writeText(getWidgetEmbedCode(selectedWebsite.tracking_id)).then(() => {
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2000);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your websites and view detailed analytics
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <a
              href="/dashboard/add-website"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Website
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Website List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Your Websites</h2>
              <a
                href="/dashboard/add-website"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Add New
              </a>
            </div>
            <div className="space-y-3">
              {websites.map((website) => (
                <div
                  key={website.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedWebsite?.id === website.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedWebsite(website)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {website.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {website.domain}
                      </p>
                      <div className="flex items-center mt-2">
                        <div className={`w-2 h-2 rounded-full mr-2 ${website.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        <span className="text-xs text-gray-500">
                          {website.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWebsite(website.id);
                      }}
                      disabled={deleting === website.id}
                      className="ml-2 p-1 text-red-600 hover:text-red-800"
                    >
                      {deleting === website.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {websites.length === 0 && (
                <div className="text-center py-8">
                  <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No websites</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a new website.
                  </p>
                  <div className="mt-6">
                    <a
                      href="/dashboard/add-website"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedWebsite ? (
            <>
              {/* Website Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedWebsite.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedWebsite.domain}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Tracking ID: {selectedWebsite.tracking_id}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${selectedWebsite.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${selectedWebsite.is_active ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      <span className={`text-sm font-medium ${selectedWebsite.is_active ? 'text-green-800' : 'text-gray-800'
                        }`}>
                        {selectedWebsite.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href={`/dashboard/analytics?id=${selectedWebsite.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    View Analytics
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(getTrackingCode(selectedWebsite.tracking_id))}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Copy Tracking Code
                  </button>
                </div>

                {/* Tracking Code */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Tracking Code</h3>
                    <button
                      onClick={() => copyToClipboard(getTrackingCode(selectedWebsite.tracking_id))}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
                    {getTrackingCode(selectedWebsite.tracking_id)}
                  </pre>
                </div>
              </div>

              {/* Widget Embed Code Generator */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CodeBracketIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Widget Embed Code</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Generate an embeddable widget to display visitor statistics on your website footer.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customization Options */}
                  <div className="space-y-4">
                    {/* Custom Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Widget Label
                      </label>
                      <input
                        type="text"
                        value={widgetLabel}
                        onChange={(e) => setWidgetLabel(e.target.value)}
                        placeholder="Enter custom label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-1">Label yang akan ditampilkan di header widget</p>
                    </div>
                  </div>

                  {/* Embed Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Embed Code
                    </label>
                    <div className="relative">
                      <pre className="p-3 bg-gray-900 text-green-400 text-xs rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                        {getWidgetEmbedCode(selectedWebsite.tracking_id)}
                      </pre>
                      <button
                        onClick={copyWidgetEmbed}
                        className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                        title="Copy embed code"
                      >
                        {embedCopied ? (
                          <CheckIcon className="h-4 w-4 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                    </div>
                    {embedCopied && (
                      <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                    )}
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Live Preview
                  </label>
                  <div className="p-4 rounded-lg flex items-center justify-center bg-gray-800" style={{ minHeight: '380px' }}>
                    <iframe
                      src={getWidgetPreviewUrl(selectedWebsite.tracking_id)}
                      width="332"
                      height="350"
                      frameBorder="0"
                      style={{ border: 'none', borderRadius: '16px' }}
                      title="Widget Preview"
                    />
                  </div>
                </div>
              </div>

              {/* Tracking Test */}
              <TrackingTest
                websiteId={selectedWebsite.id}
                trackingId={selectedWebsite.tracking_id}
                domain={selectedWebsite.domain}
                isActive={selectedWebsite.is_active}
              />
            </>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                <GlobeAltIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No website selected</h3>
              <p className="mt-2 text-sm text-gray-500">
                Select a website from the list to manage it and view analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}