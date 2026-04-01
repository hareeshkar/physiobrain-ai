import React, { useState, useEffect } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Dashboard } from './components/Dashboard';

const HARDCODED_API_KEY = 'process.env.OPENROUTER_API_KEY';

export default function App() {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for existing key or use hardcoded OpenRouter key
    const existingKey = localStorage.getItem('physiobrain_api_key');
    if (existingKey) {
      setHasKey(true);
    } else {
      // Auto-set the hardcoded OpenRouter key and proceed
      localStorage.setItem('physiobrain_api_key', HARDCODED_API_KEY);
      setHasKey(true);
    }
    setIsChecking(false);
  }, []);

  if (isChecking) return null;

  return (
    <>
      {!hasKey ? (
        <ApiKeyModal onSave={() => setHasKey(true)} />
      ) : (
        <Dashboard />
      )}
    </>
  );
}
