"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSearchBackend } from "@/lib/search-helper";
import { tavilyClient } from "@/lib/tavily";

type SearchBackend = 'duckduckgo' | 'tavily';

export default function SearchBackendSelector() {
  const [open, setOpen] = useState(false);
  const [currentBackend, setCurrentBackend] = useState<SearchBackend>('tavily');
  const [tavilyApiKey, setTavilyApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Load current backend from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('searchBackend');
      if (stored && (stored === 'duckduckgo' || stored === 'tavily')) {
        setCurrentBackend(stored);
      }

      // Load Tavily API key from localStorage
      const savedKey = localStorage.getItem('tavilyApiKey');
      if (savedKey) {
        setTavilyApiKey(savedKey);
        setApiKeyInput('');
      }
    }
  }, []);

  const handleBackendChange = (backend: SearchBackend) => {
    setCurrentBackend(backend);
    setSearchBackend(backend);
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchBackend', backend);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setTavilyApiKey(apiKeyInput);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tavilyApiKey', apiKeyInput);
      }
      setApiKeyInput('');
      tavilyClient.setApiKey(apiKeyInput);
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!tavilyApiKey && !apiKeyInput) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Update client with new API key if provided
      const keyToTest = apiKeyInput || tavilyApiKey;
      tavilyClient.setApiKey(keyToTest);

      const response = await tavilyClient.search('test query', {
        maxResults: 1,
        searchDepth: 'basic',
      });

      if (response.results && response.results.length > 0) {
        setTestResult({ 
          success: true, 
          message: `✓ Connection successful! Found ${response.results.length} result(s).` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: 'Connection failed. No results returned.' 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: `Error: ${error.message || 'Unknown error occurred'}` 
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearApiKey = () => {
    setTavilyApiKey('');
    setApiKeyInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tavilyApiKey');
    }
    setTestResult(null);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return key.substring(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.substring(key.length - 4);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Search Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Backend Settings</DialogTitle>
          <DialogDescription>
            Configure your web search provider and API keys
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Backend Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">Select Search Backend</h3>
            <div className="space-y-2">
              <Button
                variant={currentBackend === 'tavily' ? 'default' : 'outline'}
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={() => handleBackendChange('tavily')}
              >
                <div className="flex items-center gap-3 w-full">
                  {currentBackend === 'tavily' && <Check className="w-4 h-4" />}
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Tavily</div>
                    <div className="text-xs opacity-70">Recommended • Requires API Key</div>
                  </div>
                </div>
              </Button>

              <Button
                variant={currentBackend === 'duckduckgo' ? 'default' : 'outline'}
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={() => handleBackendChange('duckduckgo')}
              >
                <div className="flex items-center gap-3 w-full">
                  {currentBackend === 'duckduckgo' && <Check className="w-4 h-4" />}
                  <div className="flex-1 text-left">
                    <div className="font-semibold">DuckDuckGo</div>
                    <div className="text-xs opacity-70">Free • No API Key</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Tavily API Key Configuration */}
          {currentBackend === 'tavily' && (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="tavily-api-key">Tavily API Key</Label>
                
                {tavilyApiKey && !apiKeyInput && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">API Key Configured</p>
                      <p className="text-xs text-green-700 dark:text-green-300 break-all">
                        {maskApiKey(tavilyApiKey)}
                      </p>
                    </div>
                  </div>
                )}

                <Input
                  id="tavily-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your Tavily API key"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setTestResult(null);
                  }}
                  className="font-mono text-sm"
                />

                <div className="flex gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="h-7"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.open('https://tavily.com', '_blank');
                    }}
                    className="h-7"
                  >
                    Get API Key →
                  </Button>
                </div>
              </div>

              {/* Test Connection */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {tavilyApiKey || apiKeyInput ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="flex-1"
                      >
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                      {apiKeyInput && (
                        <>
                          <Button
                            size="sm"
                            onClick={handleSaveApiKey}
                            className="flex-1"
                          >
                            Save Key
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setApiKeyInput('')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </>
                  ) : null}
                </div>

                {testResult && (
                  <div className={`p-3 rounded-md flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                  }`}>
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      testResult.success 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`} />
                    <p className={`text-sm ${
                      testResult.success
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {testResult.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md space-y-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">About Tavily</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Fast and accurate web search results</li>
                  <li>• Includes answer extraction and follow-up questions</li>
                  <li>• Free tier available (up to 120 requests/min)</li>
                  <li>• Get your API key at <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline">tavily.com</a></li>
                </ul>
              </div>
            </div>
          )}

          {/* DuckDuckGo Info */}
          {currentBackend === 'duckduckgo' && (
            <div className="space-y-3 border-t pt-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md space-y-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">About DuckDuckGo</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• No API key required</li>
                  <li>• Free web search with privacy focus</li>
                  <li>• Limited rate limiting (30 requests/min)</li>
                  <li>• Works via public API</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
