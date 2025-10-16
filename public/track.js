// Visitor Counter Tracking Script
(function() {
  // Configuration - these will be replaced when script is generated
  const config = {
    apiUrl: 'https://your-app.vercel.app/api/track',
    websiteId: 'WEBSITE_ID_PLACEHOLDER' // This will be replaced with the actual website UUID
  };
  
  // Test mode detection
  const isTestMode = window.location.search.includes('test=true');
  
  // Generate or get session ID
  const sessionId = sessionStorage.getItem('visitor_session') || 
                   'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  sessionStorage.setItem('visitor_session', sessionId);
  
  // Get visitor information
  function getVisitorInfo() {
    const info = {
      website_id: config.websiteId, // Use the actual website UUID
      session_id: sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_resolution: screen.width + 'x' + screen.height,
      viewport_size: window.innerWidth + 'x' + window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language || navigator.userLanguage,
      timestamp: new Date().toISOString()
    };
    
    // Add test mode indicator
    if (isTestMode) {
      info.is_test = true;
      info.test_mode = 'connection_test';
    }
    
    return info;
  }
  
  // Send visitor data to server
  function trackVisitor(data) {
    try {
      // Use sendBeacon for better performance
      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(config.apiUrl, JSON.stringify(data));
        
        // In test mode, provide feedback
        if (isTestMode) {
          if (success) {
            showTestNotification('✅ Tracking data sent successfully!', 'success');
          } else {
            showTestNotification('❌ Failed to send tracking data', 'error');
          }
        }
      } else {
        // Fallback for older browsers
        fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          keepalive: true
        })
        .then(response => {
          if (isTestMode) {
            if (response.ok) {
              showTestNotification('✅ Tracking data sent successfully!', 'success');
            } else {
              showTestNotification('❌ Server error: ' + response.status, 'error');
            }
          }
        })
        .catch(error => {
          if (isTestMode) {
            showTestNotification('❌ Network error: ' + error.message, 'error');
          }
        });
      }
    } catch (error) {
      if (isTestMode) {
        showTestNotification('❌ Script error: ' + error.message, 'error');
      }
    }
  }
  
  // Track page view
  function trackPageView() {
    const visitorData = getVisitorInfo();
    trackVisitor(visitorData);
  }
  
  // Track time on page when user leaves
  function trackTimeOnPage() {
    const timeSpent = Math.round(Date.now() - pageLoadTime);
    if (timeSpent > 1000) { // Only track if spent more than 1 second
      const visitorData = getVisitorInfo();
      visitorData.duration_seconds = timeSpent / 1000;
      trackVisitor(visitorData);
    }
  }
  
  // Initialize tracking
  const pageLoadTime = Date.now();
  
  // Track initial page view
  trackPageView();
  
  // Track time on page when user leaves
  const trackEvents = ['pagehide', 'beforeunload', 'unload'];
  trackEvents.forEach(event => {
    window.addEventListener(event, trackTimeOnPage, { once: true, passive: true });
  });
  
  // Track single page app navigation
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(trackPageView, 100); // Small delay to ensure title is updated
    }
  });
  
  // Start observing for SPA navigation
  observer.observe(document, { 
    subtree: true, 
    childList: true 
  });
  
  // Track clicks on external links
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && link.hostname !== window.location.hostname) {
      const visitorData = getVisitorInfo();
      visitorData.event_type = 'external_link_click';
      visitorData.external_url = link.href;
      trackVisitor(visitorData);
    }
  }, true);
  
  // Test notification system
  function showTestNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }
  
  // Test mode initialization
  if (isTestMode) {
    showTestNotification('🧪 Visitor Counter Test Mode Active', 'info');
    
    // Test connection immediately
    setTimeout(() => {
      const testData = getVisitorInfo();
      testData.test_type = 'connection_test';
      testData.test_timestamp = new Date().toISOString();
      trackVisitor(testData);
    }, 1000);
    
    // Add test controls
    const testControls = document.createElement('div');
    testControls.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 250px;
    `;
    testControls.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #3b82f6;">🧪 Test Controls</div>
      <button id="test-track-page" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        margin-right: 4px;
      ">Track Page</button>
      <button id="test-track-event" style="
        background: #10b981;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      ">Track Event</button>
    `;
    
    document.body.appendChild(testControls);
    
    // Add event listeners for test controls
    document.getElementById('test-track-page').addEventListener('click', () => {
      trackPageView();
      showTestNotification('📊 Manual page track sent', 'success');
    });
    
    document.getElementById('test-track-event').addEventListener('click', () => {
      if (window.VisitorCounter) {
        window.VisitorCounter.trackEvent('test_event', {
          test_data: 'manual_test',
          timestamp: new Date().toISOString()
        });
        showTestNotification('🎯 Manual event track sent', 'success');
      }
    });
  }
  
  // Expose global function for manual tracking
  window.VisitorCounter = {
    trackPage: trackPageView,
    trackEvent: function(eventName, eventData) {
      const visitorData = getVisitorInfo();
      visitorData.event_type = eventName;
      visitorData.event_data = eventData;
      trackVisitor(visitorData);
    },
    testConnection: function() {
      const testData = getVisitorInfo();
      testData.test_type = 'manual_connection_test';
      trackVisitor(testData);
      if (isTestMode) {
        showTestNotification('🔧 Manual connection test sent', 'info');
      }
    }
  };
})();