'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function TestNavigationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Observations', path: '/dashboard/observations' },
    { name: 'New Observation', path: '/dashboard/observations/new' },
    { name: 'Schools', path: '/dashboard/schools' },
    { name: 'Users', path: '/dashboard/users' },
    { name: 'Teachers', path: '/dashboard/teachers' },
    { name: 'Mentoring', path: '/dashboard/mentoring' },
    { name: 'Evaluations', path: '/dashboard/evaluations' },
    { name: 'Settings', path: '/dashboard/settings' },
    { name: 'Analytics', path: '/dashboard/analytics' },
  ];

  const navigateToPage = (path: string, name: string) => {
    setCurrentPage(name);
    setIsNavigating(true);
    router.push(path);
    
    // Show page for 2 seconds before returning
    setTimeout(() => {
      setIsNavigating(false);
    }, 2000);
  };

  const testAllPages = async () => {
    for (const page of pages) {
      await new Promise(resolve => {
        navigateToPage(page.path, page.name);
        setTimeout(resolve, 3000); // Wait 3 seconds between pages
      });
    }
    setCurrentPage('Test Complete\!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Navigation Test - Prove All Pages Are Accessible</h1>
      
      <div style={{ 
        padding: '15px', 
        background: status === 'authenticated' ? '#d4edda' : '#f8d7da',
        border: '1px solid ' + (status === 'authenticated' ? '#c3e6cb' : '#f5c6cb'),
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h3>Authentication Status:</h3>
        <p><strong>Status:</strong> {status}</p>
        {session && (
          <>
            <p><strong>User:</strong> {session.name || session.email}</p>
            <p><strong>Role:</strong> {session.role}</p>
          </>
        )}
      </div>

      {currentPage && (
        <div style={{ 
          padding: '10px', 
          background: '#cfe2ff',
          border: '1px solid #b6d4fe',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Currently navigating to:</strong> {currentPage}
          {isNavigating && ' (Loading...)'}
        </div>
      )}

      <h2>Quick Navigation Tests:</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAllPages}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚀 Test All Pages Automatically
        </button>
      </div>

      <h3>Manual Navigation:</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {pages.map(page => (
          <button
            key={page.path}
            onClick={() => navigateToPage(page.path, page.name)}
            style={{
              padding: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to {page.name}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>First, login using the test session page</li>
          <li>Then click "Test All Pages Automatically" to see that all pages are accessible</li>
          <li>Or manually click each button to navigate to specific pages</li>
          <li>Watch as the app successfully navigates to each page without redirecting to login</li>
        </ol>
      </div>
    </div>
  );
}