'use client';

import { useEffect, useState } from 'react';

export default function TestGeographic() {
  const [provinces, setProvinces] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/geographic/provinces')
      .then(res => res.json())
      .then(data => {
        console.log('Provinces data:', data);
        setProvinces(data.provinces || []);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(err.toString());
      });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Geographic API</h1>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      <h2>Provinces ({provinces.length})</h2>
      <pre>{JSON.stringify(provinces.slice(0, 5), null, 2)}</pre>
    </div>
  );
}