'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
}

interface WebsiteListProps {
  onWebsiteSelect: (websiteId: string) => void;
  selectedWebsiteId?: string;
}

export default function WebsiteList({ onWebsiteSelect, selectedWebsiteId }: WebsiteListProps) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: '', domain: '' });
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      if (data.websites) {
        setWebsites(data.websites);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebsite.name || !newWebsite.domain) return;

    setAdding(true);
    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebsite),
      });

      const data = await response.json();
      if (data.website) {
        setWebsites([data.website, ...websites]);
        setNewWebsite({ name: '', domain: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding website:', error);
    } finally {
      setAdding(false);
    }
  };

  const generateTrackingScript = (trackingId: string) => {
    const scriptUrl = `${window.location.origin}/track.js`;
    return `<script src="${scriptUrl}" data-tracking-id="${trackingId}"></script>`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Websites</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Website
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAddWebsite} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Website Name
              </label>
              <input
                type="text"
                id="name"
                value={newWebsite.name}
                onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                placeholder="My Website"
              />
            </div>
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                Domain
              </label>
              <input
                type="text"
                id="domain"
                value={newWebsite.domain}
                onChange={(e) => setNewWebsite({ ...newWebsite, domain: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                placeholder="example.com"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200"
              >
                {adding ? 'Adding...' : 'Add Website'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="px-4 py-5 sm:px-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ) : websites.length === 0 ? (
          <div className="px-4 py-5 sm:px-6 text-center">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No websites</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first website.
            </p>
          </div>
        ) : (
          websites.map((website) => (
            <div
              key={website.id}
              className={`px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                selectedWebsiteId === website.id ? 'bg-indigo-50' : ''
              }`}
              onClick={() => onWebsiteSelect(website.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      website.is_active ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <GlobeAltIcon className={`h-6 w-6 ${
                        website.is_active ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{website.name}</h4>
                      {website.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{website.domain}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                      <span>Tracking ID: </span>
                      <span className="font-mono ml-1">{website.tracking_id}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(generateTrackingScript(website.tracking_id), website.id);
                    }}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                    title="Copy tracking script"
                  >
                    {copiedId === website.id ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}