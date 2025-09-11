"use client";

import React, { useState, useEffect } from "react";

type Props = {
  show: boolean;
  initialKey?: string;
  onClose: () => void;
  onSave: (key: string) => void;
};

export default function GoogleKeyModal({ show, initialKey = "", onClose, onSave }: Props) {
  const [key, setKey] = useState<string>(initialKey);

  useEffect(() => {
    if (show) setKey(initialKey);
  }, [show, initialKey]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop covers the whole screen */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-lg rounded bg-white dark:bg-gray-800 p-6 shadow-lg mx-4">
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Google Places API Key</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Enter your API key to enable the Google Places provider. The key will be saved to your browser settings.</p>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full rounded border px-3 py-2 mb-3 text-sm bg-white dark:bg-gray-700"
          placeholder="Enter API key"
        />

        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          <div className="font-medium">How to get an API key</div>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Go to the Google Cloud Console (console.cloud.google.com).</li>
            <li>Create or select a project and enable the Places API.</li>
            <li>Create an API key under &quot;APIs &amp; Services&quot; → &quot;Credentials&quot;.</li>
            <li>Restrict the key to the Places API and optionally to your domain.</li>
            <li>Paste the key above and click Save.</li>
          </ol>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-3 py-1 text-sm border">Cancel</button>
          <button
            type="button"
            onClick={() => onSave(key)}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
