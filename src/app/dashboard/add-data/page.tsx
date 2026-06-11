'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Database as PlusCircleIcon,
} from 'lucide-react';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
}

interface WeightItem {
  label: string;
  value: string;
  weight: number;
}

interface CustomPage {
  url: string;
  title: string;
  weight: number;
}

export default function AddDataPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [visitorCount, setVisitorCount] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [injecting, setInjecting] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Date range
  const [dateMode, setDateMode] = useState<'month' | 'range' | 'today' | 'week'>('month');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Distribution pattern
  const [distribution, setDistribution] = useState<'random' | 'peak' | 'night' | 'weekend' | 'weekday'>('random');

  // Advanced toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Duration settings
  const [minDuration, setMinDuration] = useState<number>(5);
  const [maxDuration, setMaxDuration] = useState<number>(300);

  // Bounce rate
  const [bounceRate, setBounceRate] = useState<number>(40);

  // Sessions per visitor
  const [minPagesPerSession, setMinPagesPerSession] = useState<number>(1);
  const [maxPagesPerSession, setMaxPagesPerSession] = useState<number>(5);

  // Country distribution
  const [countries, setCountries] = useState<WeightItem[]>([
    { label: 'Indonesia', value: 'ID', weight: 50 },
    { label: 'United States', value: 'US', weight: 15 },
    { label: 'Singapore', value: 'SG', weight: 10 },
    { label: 'Malaysia', value: 'MY', weight: 8 },
    { label: 'Australia', value: 'AU', weight: 5 },
    { label: 'Japan', value: 'JP', weight: 4 },
    { label: 'South Korea', value: 'KR', weight: 3 },
    { label: 'India', value: 'IN', weight: 3 },
    { label: 'Thailand', value: 'TH', weight: 2 },
  ]);

  // City distribution
  const [cities, setCities] = useState<WeightItem[]>([
    { label: 'Jakarta', value: 'Jakarta', weight: 30 },
    { label: 'Bandung', value: 'Bandung', weight: 15 },
    { label: 'Surabaya', value: 'Surabaya', weight: 12 },
    { label: 'Medan', value: 'Medan', weight: 10 },
    { label: 'Semarang', value: 'Semarang', weight: 8 },
    { label: 'Makassar', value: 'Makassar', weight: 7 },
    { label: 'Tangerang', value: 'Tangerang', weight: 6 },
    { label: 'Palembang', value: 'Palembang', weight: 5 },
    { label: 'Yogyakarta', value: 'Yogyakarta', weight: 4 },
    { label: 'Denpasar', value: 'Denpasar', weight: 3 },
  ]);

  // Device distribution
  const [devices, setDevices] = useState<WeightItem[]>([
    { label: 'Desktop', value: 'desktop', weight: 55 },
    { label: 'Mobile', value: 'mobile', weight: 38 },
    { label: 'Tablet', value: 'tablet', weight: 7 },
  ]);

  // Browser distribution
  const [browsers, setBrowsers] = useState<WeightItem[]>([
    { label: 'Chrome', value: 'Chrome', weight: 60 },
    { label: 'Safari', value: 'Safari', weight: 18 },
    { label: 'Firefox', value: 'Firefox', weight: 10 },
    { label: 'Edge', value: 'Edge', weight: 8 },
    { label: 'Opera', value: 'Opera', weight: 4 },
  ]);

  // OS distribution
  const [operatingSystems, setOperatingSystems] = useState<WeightItem[]>([
    { label: 'Windows', value: 'Windows', weight: 40 },
    { label: 'Android', value: 'Android', weight: 25 },
    { label: 'macOS', value: 'macOS', weight: 15 },
    { label: 'iOS', value: 'iOS', weight: 15 },
    { label: 'Linux', value: 'Linux', weight: 5 },
  ]);

  // Referrer / Traffic source distribution
  const [referrers, setReferrers] = useState<WeightItem[]>([
    { label: 'Direct', value: 'direct', weight: 30 },
    { label: 'Google', value: 'https://www.google.com', weight: 35 },
    { label: 'Facebook', value: 'https://www.facebook.com', weight: 12 },
    { label: 'Instagram', value: 'https://www.instagram.com', weight: 8 },
    { label: 'Twitter/X', value: 'https://www.twitter.com', weight: 5 },
    { label: 'LinkedIn', value: 'https://www.linkedin.com', weight: 5 },
    { label: 'YouTube', value: 'https://www.youtube.com', weight: 3 },
    { label: 'TikTok', value: 'https://www.tiktok.com', weight: 2 },
  ]);

  // Custom pages
  const [useCustomPages, setUseCustomPages] = useState<boolean>(false);
  const [customPages, setCustomPages] = useState<CustomPage[]>([
    { url: '/', title: 'Home', weight: 35 },
    { url: '/about', title: 'About Us', weight: 15 },
    { url: '/services', title: 'Services', weight: 15 },
    { url: '/products', title: 'Products', weight: 12 },
    { url: '/blog', title: 'Blog', weight: 10 },
    { url: '/contact', title: 'Contact', weight: 8 },
    { url: '/gallery', title: 'Gallery', weight: 5 },
  ]);

  // Generate years from current year to 5 years back
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const fetchWebsites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      if (data.websites) {
        setWebsites(data.websites);
        if (data.websites.length > 0 && !selectedWebsite) {
          setSelectedWebsite(data.websites[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedWebsite]);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    setInjecting(true);
    setResult(null);

    try {
      const payload: Record<string, unknown> = {
        websiteId: selectedWebsite,
        visitorCount,
        distribution,
        minDuration,
        maxDuration,
        bounceRate,
        minPagesPerSession,
        maxPagesPerSession,
        countries: countries.map(c => ({ value: c.value, weight: c.weight })),
        cities: cities.map(c => ({ value: c.value, weight: c.weight })),
        devices: devices.map(d => ({ value: d.value, weight: d.weight })),
        browsers: browsers.map(b => ({ value: b.value, weight: b.weight })),
        operatingSystems: operatingSystems.map(o => ({ value: o.value, weight: o.weight })),
        referrers: referrers.map(r => ({ value: r.value, weight: r.weight })),
      };

      // Date configuration
      if (dateMode === 'month') {
        payload.year = selectedYear;
        payload.month = selectedMonth;
      } else if (dateMode === 'range') {
        payload.startDate = startDate;
        payload.endDate = endDate;
      } else {
        payload.dateRange = dateMode;
      }

      // Custom pages
      if (useCustomPages) {
        payload.customPages = customPages.map(p => ({ url: p.url, title: p.title, weight: p.weight }));
      }

      const response = await fetch('/api/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message
        });
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

  // Weight distribution helpers
  const updateWeight = (
    items: WeightItem[],
    setItems: (items: WeightItem[]) => void,
    index: number,
    newWeight: number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], weight: Math.max(0, newWeight) };
    setItems(updated);
  };

  const addItem = (
    items: WeightItem[],
    setItems: (items: WeightItem[]) => void,
    newItem: WeightItem
  ) => {
    setItems([...items, newItem]);
  };

  const removeItem = (
    items: WeightItem[],
    setItems: (items: WeightItem[]) => void,
    index: number
  ) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalWeight = (items: WeightItem[]) => {
    return items.reduce((sum, item) => sum + item.weight, 0);
  };

  // Custom pages helpers
  const addCustomPage = () => {
    setCustomPages([...customPages, { url: '/new-page', title: 'New Page', weight: 5 }]);
  };

  const removeCustomPage = (index: number) => {
    setCustomPages(customPages.filter((_, i) => i !== index));
  };

  const updateCustomPage = (index: number, field: keyof CustomPage, value: string | number) => {
    const updated = [...customPages];
    updated[index] = { ...updated[index], [field]: value };
    setCustomPages(updated);
  };

  // Render weight distribution section
  const renderWeightSection = (
    title: string,
    items: WeightItem[],
    setItems: (items: WeightItem[]) => void,
    addLabel: string,
    showAdd: boolean = true
  ) => {
    const total = getTotalWeight(items);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">{title}</label>
          <span className={`text-xs font-medium ${total === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            Total: {total}%{total !== 100 && ' (akan dinormalisasi)'}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 w-28 truncate" title={item.label}>
                {item.label}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={item.weight}
                onChange={(e) => updateWeight(items, setItems, index, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={item.weight}
                onChange={(e) => updateWeight(items, setItems, index, parseInt(e.target.value) || 0)}
                className="w-14 text-sm border border-gray-300 rounded px-2 py-1 text-center text-gray-900"
              />
              <span className="text-xs text-gray-500 w-4">%</span>
              <button
                type="button"
                onClick={() => removeItem(items, setItems, index)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {showAdd && (
          <button
            type="button"
            onClick={() => addItem(items, setItems, { label: addLabel, value: addLabel.toLowerCase(), weight: 5 })}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add {addLabel}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <PlusCircleIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Inject Data</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Generate visitor data with full control over distribution and characteristics
        </p>
      </div>

      <form onSubmit={handleInject} className="space-y-6">
        {/* Basic Settings Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Choose website, time period, and visitor count</p>
          </div>
          <div className="px-4 py-5 sm:px-6 space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {/* Website Selection */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <select
                    id="website"
                    value={selectedWebsite}
                    onChange={(e) => setSelectedWebsite(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                    required
                  >
                    {websites.map((website) => (
                      <option key={website.id} value={website.id}>
                        {website.name} ({website.domain})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range Mode</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'today', label: 'Today' },
                      { value: 'week', label: 'Last 7 Days' },
                      { value: 'month', label: 'Specific Month' },
                      { value: 'range', label: 'Custom Range' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDateMode(option.value as typeof dateMode)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                          dateMode === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date inputs based on mode */}
                {dateMode === 'month' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                      <select
                        id="year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month</label>
                      <select
                        id="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {dateMode === 'range' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      />
                    </div>
                  </div>
                )}

                {/* Visitor Count */}
                <div>
                  <label htmlFor="visitorCount" className="block text-sm font-medium text-gray-700">
                    Total Visitors to Generate
                  </label>
                  <input
                    type="number"
                    id="visitorCount"
                    min="1"
                    max="100000"
                    value={visitorCount}
                    onChange={(e) => setVisitorCount(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Max 100,000 per injection</p>
                </div>

                {/* Distribution Pattern */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Traffic Distribution Pattern</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[
                      { value: 'random', label: 'Random', desc: 'Merata 24 jam' },
                      { value: 'peak', label: 'Peak Hours', desc: '9 AM - 5 PM' },
                      { value: 'night', label: 'Night Owl', desc: '8 PM - 2 AM' },
                      { value: 'weekend', label: 'Weekend Heavy', desc: 'Sab-Min lebih ramai' },
                      { value: 'weekday', label: 'Weekday Heavy', desc: 'Sen-Jum lebih ramai' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDistribution(option.value as typeof distribution)}
                        className={`px-3 py-3 text-sm rounded-lg border transition-all text-left ${
                          distribution === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session & Duration Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Session & Duration</h3>
            <p className="mt-1 text-sm text-gray-500">Control how long visitors stay and how many pages they visit</p>
          </div>
          <div className="px-4 py-5 sm:px-6 space-y-6">
            {/* Duration Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="minDuration" className="block text-sm font-medium text-gray-700">
                  Min Duration (seconds)
                </label>
                <input
                  type="number"
                  id="minDuration"
                  min="1"
                  max="3600"
                  value={minDuration}
                  onChange={(e) => setMinDuration(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700">
                  Max Duration (seconds)
                </label>
                <input
                  type="number"
                  id="maxDuration"
                  min="1"
                  max="3600"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
              </div>
            </div>

            {/* Bounce Rate */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="bounceRate" className="block text-sm font-medium text-gray-700">
                  Bounce Rate Target
                </label>
                <span className="text-sm text-gray-500">{bounceRate}%</span>
              </div>
              <input
                type="range"
                id="bounceRate"
                min="0"
                max="100"
                value={bounceRate}
                onChange={(e) => setBounceRate(parseInt(e.target.value))}
                className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Persentase visitor yang hanya melihat 1 halaman lalu pergi
              </p>
            </div>

            {/* Pages per Session */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="minPages" className="block text-sm font-medium text-gray-700">
                  Min Pages per Session
                </label>
                <input
                  type="number"
                  id="minPages"
                  min="1"
                  max="20"
                  value={minPagesPerSession}
                  onChange={(e) => setMinPagesPerSession(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700">
                  Max Pages per Session (non-bounce)
                </label>
                <input
                  type="number"
                  id="maxPages"
                  min="2"
                  max="50"
                  value={maxPagesPerSession}
                  onChange={(e) => setMaxPagesPerSession(parseInt(e.target.value) || 2)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Pages */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Page URLs</h3>
                <p className="mt-1 text-sm text-gray-500">Define which pages visitors will access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomPages}
                  onChange={(e) => setUseCustomPages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-sm text-gray-600">Custom</span>
              </label>
            </div>
          </div>
          {useCustomPages && (
            <div className="px-4 py-5 sm:px-6 space-y-3">
              {customPages.map((page, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={page.url}
                    onChange={(e) => updateCustomPage(index, 'url', e.target.value)}
                    placeholder="/path"
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 text-gray-900"
                  />
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updateCustomPage(index, 'title', e.target.value)}
                    placeholder="Page Title"
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 text-gray-900"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={page.weight}
                    onChange={(e) => updateCustomPage(index, 'weight', parseInt(e.target.value) || 0)}
                    className="w-16 text-sm border border-gray-300 rounded px-2 py-2 text-center text-gray-900"
                  />
                  <span className="text-xs text-gray-500">%</span>
                  <button
                    type="button"
                    onClick={() => removeCustomPage(index)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCustomPage}
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Page
              </button>
            </div>
          )}
        </div>

        {/* Advanced Distribution Settings (Collapsible) */}
        <div className="bg-white shadow rounded-lg">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-5 sm:px-6 flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">Advanced Distribution</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fine-tune country, device, browser, OS, and traffic source distribution
              </p>
            </div>
            {showAdvanced ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200 space-y-8">
              {/* Traffic Sources */}
              {renderWeightSection('Traffic Sources (Referrers)', referrers, setReferrers, 'Source')}

              <hr className="border-gray-200" />

              {/* Country Distribution */}
              {renderWeightSection('Country Distribution', countries, setCountries, 'Country')}

              <hr className="border-gray-200" />

              {/* City Distribution */}
              {renderWeightSection('City Distribution', cities, setCities, 'City')}

              <hr className="border-gray-200" />

              {/* Device Distribution */}
              {renderWeightSection('Device Type Distribution', devices, setDevices, 'Device', false)}

              <hr className="border-gray-200" />

              {/* Browser Distribution */}
              {renderWeightSection('Browser Distribution', browsers, setBrowsers, 'Browser')}

              <hr className="border-gray-200" />

              {/* OS Distribution */}
              {renderWeightSection('Operating System Distribution', operatingSystems, setOperatingSystems, 'OS')}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Perhatian</h3>
              <p className="mt-1 text-sm text-amber-700">
                Data yang di-inject ditandai sebagai <code className="bg-amber-100 px-1 rounded">is_fake: true</code> dan dapat difilter kapan saja.
                Proses inject data dalam jumlah besar (&gt;10,000) bisa memakan waktu beberapa detik.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Will generate <strong className="text-gray-900">{visitorCount.toLocaleString()}</strong> visitor records
          </p>
          <button
            type="submit"
            disabled={injecting || !selectedWebsite}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-lg"
          >
            {injecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Injecting {visitorCount.toLocaleString()} visitors...
              </>
            ) : (
              <>
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Inject Data
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
