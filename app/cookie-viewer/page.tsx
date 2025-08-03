'use client';

import { useEffect, useState } from 'react';

export default function CookieViewer() {
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Check cookies every second
    const interval = setInterval(() => {
      setCookies(document.cookie || '(no cookies)');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Browser Cookies</h1>
      <p>This page shows cookies accessible to JavaScript (non-httpOnly):</p>
      <pre style={{ background: '#f0f0f0', padding: 10 }}>
        {cookies}
      </pre>
      <p>Note: httpOnly cookies (like auth-token) won't appear here but are still sent with requests.</p>
    </div>
  );
}