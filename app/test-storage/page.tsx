'use client';

import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { 
  uploadFile, 
  listFiles, 
  deleteFile, 
  createBucket,
  listBuckets,
  getFileInfo 
} from '../lib/storage';
import { Trash2, RefreshCw, FolderPlus, Info, CheckCircle, XCircle } from 'lucide-react';

export default function TestStoragePage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [newBucketName, setNewBucketName] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('uploads');
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_STORAGE_API || 'http://157.10.73.52:3500');

  // Test API connection
  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        connection: { success: true, message: 'API is healthy', data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        connection: { success: false, message: error.message }
      }));
    }
    setLoading(false);
  };

  // Load files from bucket
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await listFiles(selectedBucket);
      setFiles(response.objects || []);
      setTestResults(prev => ({
        ...prev,
        listFiles: { success: true, message: `Loaded ${response.count} files` }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        listFiles: { success: false, message: error.message }
      }));
    }
    setLoading(false);
  };

  // Load buckets
  const loadBuckets = async () => {
    setLoading(true);
    try {
      const response = await listBuckets();
      setBuckets(response.buckets || []);
      setTestResults(prev => ({
        ...prev,
        listBuckets: { success: true, message: `Found ${response.buckets.length} buckets` }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        listBuckets: { success: false, message: error.message }
      }));
    }
    setLoading(false);
  };

  // Create new bucket
  const handleCreateBucket = async () => {
    if (!newBucketName) return;
    setLoading(true);
    try {
      await createBucket(newBucketName);
      setTestResults(prev => ({
        ...prev,
        createBucket: { success: true, message: `Bucket "${newBucketName}" created` }
      }));
      setNewBucketName('');
      await loadBuckets();
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        createBucket: { success: false, message: error.message }
      }));
    }
    setLoading(false);
  };

  // Delete file
  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;
    setLoading(true);
    try {
      await deleteFile(fileName, selectedBucket);
      setTestResults(prev => ({
        ...prev,
        deleteFile: { success: true, message: `Deleted ${fileName}` }
      }));
      await loadFiles();
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        deleteFile: { success: false, message: error.message }
      }));
    }
    setLoading(false);
  };

  // Get file info
  const handleGetFileInfo = async (fileName: string) => {
    setLoading(true);
    try {
      const info = await getFileInfo(fileName, selectedBucket);
      setTestResults(prev => ({
        ...prev,
        fileInfo: { success: true, message: `Got info for ${fileName}`, data: info }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        fileInfo: { success: false, message: error.message }
      }));
    }
    setLoading(false);
  };

  // Handle upload complete
  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(files);
    setTestResults(prev => ({
      ...prev,
      upload: { success: true, message: `Uploaded ${files.length} file(s)` }
    }));
    loadFiles();
  };

  // Test all features
  const runAllTests = async () => {
    await testConnection();
    await loadBuckets();
    await loadFiles();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Storage System Test</h1>

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage API URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="http://157.10.73.52:3500"
            />
          </div>
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Test Connection
          </button>
          <button
            onClick={runAllTests}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            Run All Tests
          </button>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {Object.entries(testResults).map(([test, result]: [string, any]) => (
              <div key={test} className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{test}</p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.data && (
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Bucket
            </label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="uploads">uploads</option>
              {buckets.map(bucket => (
                <option key={bucket.name} value={bucket.name}>
                  {bucket.name}
                </option>
              ))}
            </select>
          </div>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            multiple={true}
            bucket={selectedBucket}
          />
        </div>

        {/* Bucket Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bucket Management</h2>
          
          {/* Create Bucket */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="New bucket name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleCreateBucket}
                disabled={loading || !newBucketName}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>

          {/* Buckets List */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Existing Buckets</h3>
              <button
                onClick={loadBuckets}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {buckets.length > 0 ? (
              <div className="space-y-1">
                {buckets.map(bucket => (
                  <div
                    key={bucket.name}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">{bucket.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(bucket.creationDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No buckets found</p>
            )}
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Files in "{selectedBucket}" ({files.length})
          </h2>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {file.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.lastModified).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGetFileInfo(file.name)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <a
                          href={`${apiUrl.replace(':3500', ':9000')}/${selectedBucket}/${file.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No files found. Upload some files to test!</p>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>SSH into your server: <code className="bg-yellow-100 px-1">ssh ubuntu@157.10.73.52</code></li>
          <li>Copy and run the setup commands from <code className="bg-yellow-100 px-1">MINIO_SETUP_COMMANDS.txt</code></li>
          <li>Save the Access Key and Secret Key displayed after setup</li>
          <li>Test the connection using the button above</li>
          <li>If successful, you can start uploading files!</li>
        </ol>
      </div>
    </div>
  );
}