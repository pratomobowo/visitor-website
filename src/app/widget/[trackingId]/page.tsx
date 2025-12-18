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

    // Responsive styles
    const styles = `
        * { box-sizing: border-box; }
        html, body { 
            margin: 0; 
            padding: 0; 
            background: transparent; 
            width: 100%; 
            height: 100%;
            overflow: hidden;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .pulse-dot {
            animation: pulse 2s ease-in-out infinite;
        }
        .widget-container {
            width: 100%;
            height: 100%;
            padding: 4%;
            background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #ffffff;
            display: flex;
            flex-direction: column;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 3%;
            flex-shrink: 0;
        }
        .label {
            font-size: clamp(8px, 2.5vw, 11px);
            font-weight: 600;
            color: #9ca3af;
            letter-spacing: 1px;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 50%;
        }
        .online-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            background: rgba(34, 197, 94, 0.15);
            border-radius: 10px;
            flex-shrink: 0;
        }
        .online-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #22c55e;
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
        }
        .online-text {
            font-size: clamp(9px, 2.5vw, 11px);
            color: #22c55e;
            font-weight: 600;
            white-space: nowrap;
        }
        .main-stat {
            margin-bottom: 3%;
            flex-shrink: 0;
        }
        .main-number {
            font-size: clamp(24px, 10vw, 42px);
            font-weight: 700;
            color: #ffffff;
            line-height: 1.1;
        }
        .main-label {
            font-size: clamp(9px, 2.5vw, 12px);
            color: #6b7280;
            margin-top: 2px;
        }
        .chart-container {
            flex: 1;
            min-height: 0;
            background: rgba(99, 102, 241, 0.05);
            border-radius: 8px;
            padding: 3%;
            margin-bottom: 3%;
            display: flex;
            flex-direction: column;
        }
        .chart-svg {
            width: 100%;
            flex: 1;
            min-height: 30px;
        }
        .chart-label {
            font-size: clamp(7px, 2vw, 9px);
            color: #6b7280;
            text-align: center;
            margin-top: 2px;
            flex-shrink: 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3%;
            flex-shrink: 0;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 3% 4%;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stat-label {
            font-size: clamp(7px, 2vw, 9px);
            font-weight: 600;
            color: #6b7280;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        .stat-value {
            font-size: clamp(14px, 5vw, 20px);
            font-weight: 700;
            color: #e5e7eb;
        }
    `;

    if (loading) {
        return (
            <>
                <style>{styles}</style>
                <div className="widget-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid rgba(99, 102, 241, 0.3)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <style>{styles}</style>
                <div className="widget-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: '#ef4444', fontSize: 'clamp(10px, 3vw, 14px)', textAlign: 'center' }}>
                        {error}
                    </div>
                </div>
            </>
        );
    }

    // Generate SVG path for line chart
    const chartData = data?.chartData || [];
    const maxCount = Math.max(...chartData.map(d => d.count), 1);

    const generatePath = () => {
        if (chartData.length === 0) return '';
        const points = chartData.map((d, i) => {
            const x = 5 + (i / (chartData.length - 1 || 1)) * 90;
            const y = 90 - (d.count / maxCount) * 80;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    return (
        <>
            <style>{styles}</style>
            <div className="widget-container">
                {/* Header */}
                <div className="header">
                    <div className="label">{label}</div>
                    <div className="online-badge">
                        <div className="online-dot pulse-dot" />
                        <span className="online-text">
                            {formatNumber(data?.onlineVisitors || 0)} Online
                        </span>
                    </div>
                </div>

                {/* Main Stat */}
                <div className="main-stat">
                    <div className="main-number">{formatNumber(data?.todayVisitors || 0)}</div>
                    <div className="main-label">Visitors Today</div>
                </div>

                {/* Chart */}
                <div className="chart-container">
                    <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                        </defs>
                        {chartData.length > 0 && (
                            <path
                                d={generatePath()}
                                fill="none"
                                stroke="url(#lineGradient)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                        {chartData.map((d, i) => {
                            const x = 5 + (i / (chartData.length - 1 || 1)) * 90;
                            const y = 90 - (d.count / maxCount) * 80;
                            return (
                                <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r="2"
                                    fill="#6366f1"
                                    stroke="#1a1a2e"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}
                    </svg>
                    <div className="chart-label">Last 7 Days</div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Yesterday</div>
                        <div className="stat-value">{formatNumber(data?.yesterdayVisitors || 0)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">This Month</div>
                        <div className="stat-value">{formatNumber(data?.thisMonthVisitors || 0)}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
