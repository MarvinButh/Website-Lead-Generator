"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  // optional pagination props — when provided render Prev/Next on the right
  page?: number;
  setPage?: (n: number) => void;
  total?: number;
  pageSize?: number;
};

export default function ManageLeadsActions({ page, setPage, total, pageSize = 10 }: Props) {
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
    <div className="mt-4 flex items-center gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onFilter}
          disabled={!!loading}
          className="btn btn-warning btn-md font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {loading === "filter" ? "Filtering..." : "Filter Leads"}
        </button>
        <button
          onClick={onGenerateOffers}
          disabled={!!loading}
          className="btn btn-success btn-md font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {loading === "offers" ? "Generating Offers..." : "Generate Offers"}
        </button>
        <button
          onClick={onClear}
          disabled={!!loading}
          className="btn btn-error btn-md font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {loading === "clear" ? "Clearing..." : "Clear Leads"}
        </button>
        {message && <span className="text-sm text-base-content opacity-70">{message}</span>}
        {error && <span className="text-sm text-error">{error}</span>}
      </div>

      {/* Pagination actions on the right, separated by space */}
      {typeof page === "number" && typeof setPage === "function" && typeof total === "number" && (
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, (page || 1) - 1))}
            disabled={(page || 1) <= 1}
            className="btn btn-outline btn-md font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            Prev
          </button>
          <div className="text-sm opacity-70 px-4 py-2 bg-base-200 rounded-lg">Page {page} of {Math.max(1, Math.ceil((total || 0) / (pageSize || 1)))}</div>
          <button
            onClick={() => setPage((page || 1) + 1)}
            disabled={(page || 1) * (pageSize || 1) >= (total || 0)}
            className="btn btn-outline btn-md font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
