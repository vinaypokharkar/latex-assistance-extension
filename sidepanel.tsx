import { useState, useEffect } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import MainPanel from './components/MainPanel';

export default function IndexSidePanel() {
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for existing API key on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
          setHasApiKey(true);
        }
      });
    }
  }, []);

  const handleApiKeySuccess = () => {
    setHasApiKey(true);
  };

  const handleSignOut = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['geminiApiKey'], () => {
        setHasApiKey(false);
      });
    } else {
      setHasApiKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {hasApiKey ? (
        <MainPanel onSignOut={handleSignOut} />
      ) : (
        <ApiKeySetup onSuccess={handleApiKeySuccess} />
      )}
    </div>
  );
}
