import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, Key, Loader2, AlertCircle } from 'lucide-react';

export default function ApiKeySetup({ onSuccess }: { onSuccess: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if API key exists on mount and redirect if it does
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
          setApiKey(result.geminiApiKey);
          onSuccess(); // Redirect if API key exists
        }
      });
    }
  }, [onSuccess]);

  const validateApiKey = async (key) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello"
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Invalid API key');
    }

    return await response.json();
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      // Validate API key with Gemini
      await validateApiKey(apiKey);
      
      // If validation succeeds, save to chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error('Failed to save API key:', chrome.runtime.lastError);
            setError('Failed to save API key: ' + chrome.runtime.lastError.message);
            setLoading(false);
            return;
          }
          console.log('API key saved to chrome.storage.local');
          setSaved(true);
          setLoading(false);
          setTimeout(() => {
            setSaved(false);
            onSuccess(); // Redirect after successful save
          }, 1000);
        });
      } else {
        // Fallback for preview/development
        console.log('Chrome storage not available (preview mode)');
        setSaved(true);
        setLoading(false);
        setTimeout(() => {
          setSaved(false);
          onSuccess(); // Redirect in preview mode too
        }, 1000);
      }
    } catch (err) {
      console.error('API key validation failed:', err);
      setError('Provide valid API key');
      setLoading(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    setError('');
    setSaved(false);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['geminiApiKey'], () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          console.error('Failed to remove API key:', chrome.runtime.lastError);
          return;
        }
        console.log('API key removed from chrome.storage.local');
      });
    }
  };

  return (
    <div className="w-80 p-6 bg-white">
      <div className="flex items-center gap-2 mb-6">
        <Key className="w-5 h-5 text-gray-700" />
        <h1 className="text-lg font-semibold text-gray-800">Gemini API Key</h1>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError('');
            }}
            placeholder="Enter your API key"
            className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          {saved ? 'API key validated and stored successfully' : 'Stored in Extension Storage (local only)'}
        </p>
      </div>
    </div>
  );
}