export default function TestDirectAccess() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Direct Access Test - No Auth Required</h1>
      <p>If you can see this page, auth restrictions are removed.</p>
      <p>Current time: {new Date().toISOString()}</p>
      <a href="/dashboard" style={{ color: 'blue', textDecoration: 'underline' }}>
        Try Dashboard Link
      </a>
    </div>
  );
}