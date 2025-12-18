'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface WidgetData {
    websiteName: string;
    onlineVisitors: number;
    todayVisitors: number;
    yesterdayVisitors: number;
}

export default function WidgetPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const trackingId = params.trackingId as string;

    const [data, setData] = useState<WidgetData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Get customization options from query params
    const theme = searchParams.get('theme') || 'light';
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

    const isDark = theme === 'dark';
    const label = customLabel || data?.websiteName || 'Visitor Counter';

    // Theme styles
    const containerStyle: React.CSSProperties = {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        width: '200px',
        padding: '16px',
        borderRadius: '16px',
        background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        border: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.05)',
        color: isDark ? '#f1f5f9' : '#1e293b',
    };

    const headerStyle: React.CSSProperties = {
        fontSize: '12px',
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        color: isDark ? '#94a3b8' : '#64748b',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    };

    const statItemStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: isDark
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : '1px solid rgba(0, 0, 0, 0.04)',
    };

    const statNumberStyle: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: 1.2,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const statLabelStyle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 500,
        marginTop: '4px',
        color: isDark ? '#94a3b8' : '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                        borderTopColor: isDark ? '#60a5fa' : '#3b82f6',
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
            <div style={containerStyle}>
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#ef4444' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {/* Pulse animation style */}
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

            {/* Header */}
            <div style={headerStyle}>{label}</div>

            {/* Online Now */}
            <div style={statItemStyle}>
                <div style={statNumberStyle}>
                    <span
                        className="pulse-dot"
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                        }}
                    />
                    <span style={{ color: '#22c55e' }}>{data?.onlineVisitors || 0}</span>
                </div>
                <div style={statLabelStyle}>Online Now</div>
            </div>

            {/* Today */}
            <div style={statItemStyle}>
                <div style={statNumberStyle}>
                    <span style={{ fontSize: '18px' }}>👁</span>
                    <span style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>
                        {data?.todayVisitors || 0}
                    </span>
                </div>
                <div style={statLabelStyle}>Today</div>
            </div>

            {/* Yesterday */}
            <div style={{ ...statItemStyle, borderBottom: 'none', paddingBottom: 0 }}>
                <div style={statNumberStyle}>
                    <span style={{ fontSize: '18px' }}>📊</span>
                    <span style={{ color: isDark ? '#a78bfa' : '#8b5cf6' }}>
                        {data?.yesterdayVisitors || 0}
                    </span>
                </div>
                <div style={statLabelStyle}>Yesterday</div>
            </div>
        </div>
    );
}
