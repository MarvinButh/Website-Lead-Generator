"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManageLeadsActions() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const run = async (label: string, fn: () => Promise<void>) => {
    setLoading(label);
    setMessage(null);
    setError(null);
    try {
      await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Action failed";
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const onFilter = () =>
    run("filter", async () => {
      const res = await fetch(`${apiBase}/leads/filter`, { method: "POST" });
      if (!res.ok) throw new Error(`Filter failed: ${res.status}`);
      const data = await res.json();
      setMessage(`Kept ${data.filtered ?? 0}, removed ${data.removed ?? 0}.`);
      router.refresh();
    });

  const onGenerateOffers = () =>
    run("offers", async () => {
      const res = await fetch(`${apiBase}/leads/generate-offers`, { method: "POST" });
      if (!res.ok) throw new Error(`Generate offers failed: ${res.status}`);
      const data = await res.json();
      setMessage(`Generated ${data.offers_generated ?? 0} offers.`);
      router.refresh();
    });

  const onClear = () =>
    run("clear", async () => {
      if (!confirm("This will delete all leads and remove generated offers. Continue?")) return;
      const res = await fetch(`${apiBase}/leads`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Clear failed: ${res.status}`);
      const data = await res.json();
      setMessage(`Deleted ${data.deleted ?? 0} leads${data.offers_dir_removed ? ", removed offers directory" : ""}.`);
      router.refresh();
    });

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        onClick={onFilter}
        disabled={!!loading}
        className="inline-flex items-center justify-center rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {loading === "filter" ? "Filtering..." : "Filter Leads"}
      </button>
      <button
        onClick={onGenerateOffers}
        disabled={!!loading}
        className="inline-flex items-center justify-center rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading === "offers" ? "Generating Offers..." : "Generate Offers"}
      </button>
      <button
        onClick={onClear}
        disabled={!!loading}
        className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading === "clear" ? "Clearing..." : "Clear Leads"}
      </button>
      {message && <span className="text-sm text-gray-700 dark:text-gray-300">{message}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
