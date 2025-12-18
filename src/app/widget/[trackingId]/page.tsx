'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface ChartDataPoint {
    day: string;
    count: number;
}

interface WidgetData {
    websiteName: string;
    onlineVisitors: number;
    todayVisitors: number;
    yesterdayVisitors: number;
    thisMonthVisitors: number;
    chartData: ChartDataPoint[];
}

export default function WidgetPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const trackingId = params.trackingId as string;

    const [data, setData] = useState<WidgetData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Get customization options from query params
    const customLabel = searchParams.get('label');

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`/api/widget/${trackingId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch widget data');
            }
            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            setError('Unable to load visitor data');
            console.error('Widget fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [trackingId]);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const label = customLabel || data?.websiteName || 'Visitor Counter';

    // Format number with comma separator
    const formatNumber = (num: number): string => {
        return num.toLocaleString('id-ID');
    };

    // Generate SVG path for line chart
    const generateChartPath = (chartData: ChartDataPoint[]): string => {
        if (!chartData || chartData.length === 0) return '';

        const maxCount = Math.max(...chartData.map(d => d.count), 1);
        const width = 280;
        const height = 80;
        const padding = 10;

        const points = chartData.map((d, i) => {
            const x = padding + (i / (chartData.length - 1 || 1)) * (width - padding * 2);
            const y = height - padding - (d.count / maxCount) * (height - padding * 2);
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    // Generate dots for chart
    const generateChartDots = (chartData: ChartDataPoint[]): { x: number; y: number; count: number }[] => {
        if (!chartData || chartData.length === 0) return [];

        const maxCount = Math.max(...chartData.map(d => d.count), 1);
        const width = 280;
        const height = 80;
        const padding = 10;

        return chartData.map((d, i) => ({
            x: padding + (i / (chartData.length - 1 || 1)) * (width - padding * 2),
            y: height - padding - (d.count / maxCount) * (height - padding * 2),
            count: d.count
        }));
    };

    if (loading) {
        return (
            <div style={{
                width: '320px',
                padding: '24px',
                background: '#1a1a2e',
                borderRadius: '16px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid rgba(99, 102, 241, 0.3)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto',
                    }} />
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                width: '320px',
                padding: '24px',
                background: '#1a1a2e',
                borderRadius: '16px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#ef4444',
                textAlign: 'center',
            }}>
                {error}
            </div>
        );
    }

    const chartPath = generateChartPath(data?.chartData || []);
    const chartDots = generateChartDots(data?.chartData || []);

    return (
        <div style={{
            width: '320px',
            padding: '24px',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
            borderRadius: '16px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}>
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

            {/* Header with Online indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
            }}>
                <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#9ca3af',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                }}>
                    {label}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    borderRadius: '12px',
                }}>
                    <div
                        className="pulse-dot"
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                        }}
                    />
                    <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                        {formatNumber(data?.onlineVisitors || 0)} Online
                    </span>
                </div>
            </div>

            {/* Today's Visitors - Main Number */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    fontSize: '42px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.1,
                }}>
                    {formatNumber(data?.todayVisitors || 0)}
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                }}>
                    Visitors Today
                </div>
            </div>

            {/* Line Chart */}
            <div style={{
                marginBottom: '20px',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '12px',
                padding: '12px 8px',
            }}>
                <svg width="280" height="80" viewBox="0 0 280 80" style={{ display: 'block' }}>
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Line */}
                    {chartPath && (
                        <path
                            d={chartPath}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                        />
                    )}

                    {/* Dots */}
                    {chartDots.map((dot, i) => (
                        <circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r="4"
                            fill="#6366f1"
                            stroke="#1a1a2e"
                            strokeWidth="2"
                        />
                    ))}
                </svg>
                <div style={{
                    fontSize: '10px',
                    color: '#6b7280',
                    textAlign: 'center',
                    marginTop: '4px',
                }}>
                    Last 7 Days Trend
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
            }}>
                {/* Yesterday */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#6b7280',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                    }}>
                        Yesterday
                    </div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#e5e7eb',
                    }}>
                        {formatNumber(data?.yesterdayVisitors || 0)}
                    </div>
                </div>

                {/* This Month */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#6b7280',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                    }}>
                        This Month
                    </div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#e5e7eb',
                    }}>
                        {formatNumber(data?.thisMonthVisitors || 0)}
                    </div>
                </div>
            </div>
        </div>
    );
}
