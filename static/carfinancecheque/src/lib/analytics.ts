// Google Analytics 4 with consent mode
export function initGA() {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID || 'G-DEJB79ND9N';

  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('js', new Date());

  // Set default consent to denied until user accepts
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
  });
  gtag('config', trackingId, { 'send_page_view': true });

  // Scroll depth tracking
  var scrollFired = {};
  window.addEventListener('scroll', function() {
    var scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    [25, 50, 75, 100].forEach(function(threshold) {
      if (scrollPercent >= threshold && !scrollFired[threshold]) {
        scrollFired[threshold] = true;
        gtag('event', 'scroll', { 'percent_scrolled': threshold });
      }
    });
  });

  // Consent banner logic
  var banner = document.getElementById('consent-banner');
  var consent = localStorage.getItem('cookie_consent');
  if (!consent) {
    banner.style.display = 'block';
  } else {
    updateConsent(consent === 'granted');
  }
  document.getElementById('consent-accept').addEventListener('click', function() {
    localStorage.setItem('cookie_consent', 'granted');
    updateConsent(true);
    banner.style.display = 'none';
  });
  document.getElementById('consent-reject').addEventListener('click', function() {
    localStorage.setItem('cookie_consent', 'denied');
    updateConsent(false);
    banner.style.display = 'none';
  });
  function updateConsent(granted) {
    gtag('consent', 'update', {
      'ad_storage': granted ? 'granted' : 'denied',
      'ad_user_data': granted ? 'granted' : 'denied',
      'ad_personalization': granted ? 'granted' : 'denied',
      'analytics_storage': granted ? 'granted' : 'denied'
    });
  }
  // Expose function to re-open banner (e.g., from footer link)
  window.openConsentBanner = function() {
    banner.style.display = 'block';
  };
}
