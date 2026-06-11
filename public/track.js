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

  // Track whether we already sent the page view (prevent double tracking)
  let pageViewSent = false;
  let durationSent = false;

  // Get visitor information
  function getVisitorInfo() {
    return {
      website_id: config.websiteId,
      session_id: sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  // Send visitor data to server
  function trackVisitor(data) {
    try {
      // Use sendBeacon with Blob to ensure correct Content-Type
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        var success = navigator.sendBeacon(config.apiUrl, blob);

        if (isTestMode) {
          showTestNotification(
            success ? '✅ Tracking data sent successfully!' : '❌ Failed to send tracking data',
            success ? 'success' : 'error'
          );
        }
      } else {
        // Fallback for older browsers
        fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        }).then(function(response) {
          if (isTestMode) {
            showTestNotification(
              response.ok ? '✅ Tracking data sent!' : '❌ Server error: ' + response.status,
              response.ok ? 'success' : 'error'
            );
          }
        }).catch(function(error) {
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

  // Track page view (only once per page load)
  function trackPageView() {
    if (pageViewSent) return;
    pageViewSent = true;
    durationSent = false;

    var visitorData = getVisitorInfo();
    visitorData.duration_seconds = 0;
    trackVisitor(visitorData);
  }

  // Track duration when user leaves (update, not a new page view)
  function trackDuration() {
    if (durationSent) return;
    durationSent = true;

    var timeSpent = Math.round((Date.now() - pageLoadTime) / 1000);
    if (timeSpent < 2) return; // Skip if less than 2 seconds

    var visitorData = getVisitorInfo();
    visitorData.duration_seconds = timeSpent;
    visitorData.is_duration_update = true;
    trackVisitor(visitorData);
  }

  // Initialize tracking
  var pageLoadTime = Date.now();

  // Track initial page view
  trackPageView();

  // Track duration on page leave (only fires once due to durationSent flag)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      trackDuration();
    }
  });

  // Fallback for browsers that don't support visibilitychange well
  window.addEventListener('pagehide', trackDuration, { once: true });

  // Track single page app navigation
  var lastUrl = window.location.href;

  // Use History API interception (more efficient than MutationObserver)
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  function onUrlChange() {
    var currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // Reset for new page
      pageViewSent = false;
      durationSent = false;
      pageLoadTime = Date.now();
      setTimeout(trackPageView, 100);
    }
  }

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    onUrlChange();
  };

  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    onUrlChange();
  };

  window.addEventListener('popstate', onUrlChange);

  // Track clicks on external links
  document.addEventListener('click', function(e) {
    var link = e.target.closest ? e.target.closest('a') : null;
    if (link && link.href && link.hostname !== window.location.hostname) {
      var visitorData = getVisitorInfo();
      visitorData.event_type = 'external_link_click';
      visitorData.external_url = link.href;
      trackVisitor(visitorData);
    }
  }, true);

  // Test notification system
  function showTestNotification(message, type) {
    type = type || 'info';
    var notification = document.createElement('div');
    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:' +
      (type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6') +
      ';color:white;padding:12px 20px;border-radius:8px;font-family:system-ui,sans-serif;' +
      'font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;' +
      'max-width:300px;transition:opacity 0.3s;';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
      notification.style.opacity = '0';
      setTimeout(function() {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 300);
    }, 4000);

    notification.addEventListener('click', function() {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    });
  }

  // Test mode UI
  if (isTestMode) {
    showTestNotification('🧪 Visitor Counter Test Mode Active', 'info');
  }

  // Expose global API
  window.VisitorCounter = {
    trackPage: function() {
      pageViewSent = false;
      trackPageView();
    },
    trackEvent: function(eventName, eventData) {
      var visitorData = getVisitorInfo();
      visitorData.event_type = eventName;
      visitorData.event_data = eventData;
      trackVisitor(visitorData);
    },
    testConnection: function() {
      var testData = getVisitorInfo();
      testData.test_type = 'manual_connection_test';
      trackVisitor(testData);
    }
  };
})();
