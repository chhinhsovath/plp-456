'use client';

import { useState } from 'react';

export default function TestSimpleCookie() {
  const [results, setResults] = useState<string[]>([]);

  const log = (msg: string) => {
    setResults(prev => [...prev, `${new Date().toISOString()}: ${msg}`]);
  };

  const setCookie = async () => {
    // Set a simple cookie via API
    const response = await fetch('/api/auth/test-set-cookie', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    log(`Set cookie response: ${JSON.stringify(data)}`);
  };

  const getCookie = async () => {
    // Get cookie via API
    const response = await fetch('/api/auth/test-get-cookie', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    log(`Get cookie response: ${JSON.stringify(data)}`);
  };

  const checkDocumentCookie = () => {
    log(`Document.cookie: ${document.cookie || '(empty)'}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Simple Cookie Test</h1>
      <div>
        <button onClick={setCookie}>Set Cookie via API</button>
        <button onClick={getCookie} style={{ marginLeft: 10 }}>Get Cookie via API</button>
        <button onClick={checkDocumentCookie} style={{ marginLeft: 10 }}>Check document.cookie</button>
        <button onClick={() => setResults([])} style={{ marginLeft: 10 }}>Clear</button>
      </div>
      <pre style={{ marginTop: 20, background: '#f0f0f0', padding: 10 }}>
        {results.join('\n')}
      </pre>
    </div>
  );
}