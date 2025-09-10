"use client";
import LeadCard from "@/components/LeadCard";
import { useSelectedLead, SelectedLead } from "@/context/SelectedLeadContext";
import { useEffect, useState, useRef } from "react";
import LeadSummaryCard from "@/components/LeadSummaryCard";
import { useRouter } from "next/navigation";
import ManageLeadsActions from "@/components/ManageLeadsActions";

const PAGE_SIZE = 10;

// Minimal shape — replace or extend to match backend
type LeadItem = {
	id: number;
	company_name: string;
	city?: string;
	phone?: string;
	email?: string;
	interested?: boolean | null;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const LeadsPage = () => {
    const router = useRouter();
    const { selectedLead, setSelectedLead } = useSelectedLead();
    const listRef = useRef<HTMLDivElement | null>(null);

    // Read initial state from URL so state survives navigation
    const getInitial = () => {
        try {
            const p = new URLSearchParams(window.location.search);
            const pageParam = Number(p.get('page') || '1') || 1;
            const q = p.get('q') || '';
            const statusParam = (p.get('status') as 'all'|'interested'|'discarded') || 'all';
            return { page: pageParam, q, status: statusParam };
        } catch {
            return { page: 1, q: '', status: 'all' as const };
        }
    };

    const initial = getInitial();
    const [leads, setLeads] = useState<LeadItem[]>([]);
    const [page, setPage] = useState<number>(initial.page);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<string>(initial.q);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'all'|'interested'|'discarded'>(initial.status);

	// helper to compute filtered leads (treat null/undefined as discarded)
	const filteredLeads = leads.filter((l) => {
		if (status === 'all') return true;
		if (status === 'interested') return l.interested === true;
		// discarded: anything not explicitly true
		return l.interested !== true;
	});

	useEffect(() => {
		const onUpdated = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (!detail || typeof detail.id === "undefined") return;
			setLeads((prev) =>
				prev.map((l) =>
					l.id === detail.id ? { ...l, interested: detail.interested } : l
				)
			);
		};
		window.addEventListener("lead-updated", onUpdated as EventListener);
		return () => window.removeEventListener("lead-updated", onUpdated as EventListener);
	}, []);

	// Fetch leads (with basic pagination + filter)
	useEffect(() => {
		let mounted = true;
		const fetchLeads = async () => {
			setLoading(true);
			setError(null);
			try {
				const params = new URLSearchParams();
				params.set("page", String(page));
				params.set("page_size", String(PAGE_SIZE));
				if (filter) params.set("q", filter);
				const res = await fetch(`${apiBase}/leads?${params.toString()}`);
				if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
				const j = await res.json();
				if (!mounted) return;
				// Support API that returns either an array or { items, total }
				let items: LeadItem[] = [];
				let totalCount = 0;
				if (Array.isArray(j)) {
					items = j as LeadItem[];
					// try header first, then length
					totalCount = Number(res.headers.get('X-Total-Count')) || items.length;
				} else {
					items = (j.items as LeadItem[]) || [];
					totalCount = typeof j.total === 'number' ? j.total : (items?.length || Number(res.headers.get('X-Total-Count')) || 0);
				}
				setLeads(items || []);
				setTotal(totalCount || 0);
			} catch (err: unknown) {
				console.error('Failed to fetch leads', err);
				const msg = err instanceof Error ? err.message : String(err);
				if (mounted) setError(msg || 'Failed to fetch leads');
			} finally {
				if (mounted) setLoading(false);
			}
		};
		fetchLeads();
		return () => {
			mounted = false;
		};
	}, [page, filter]);

    // Keep URL in sync with current page/filter/status so navigating away and back preserves state
    useEffect(() => {
        try {
            const params = new URLSearchParams();
            if (page > 1) params.set('page', String(page));
            if (filter) params.set('q', filter);
            if (status && status !== 'all') params.set('status', status);
            const qs = params.toString();
            const path = window.location.pathname + (qs ? `?${qs}` : '');
            router.replace(path);
        } catch {
            // ignore in non-browser envs
        }
    }, [page, filter, status, router]);

	// Auto-scroll selected lead into view
	useEffect(() => {
		if (!selectedLead) return;
		const el = document.getElementById(`lead-${selectedLead.id}`);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [selectedLead]);

	// When a lead becomes selected (lightweight), fetch full details and update context
    const selectedId = selectedLead?.id;
    useEffect(() => {
        let mounted = true;
        if (!selectedId) return;
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${apiBase}/leads/${selectedId}`);
                if (!res.ok) return;
                const j = await res.json();
                if (!mounted) return;
                // replace selected lead with server-provided details
                setSelectedLead(j as SelectedLead);
            } catch {
                // ignore
            }
        };
        fetchDetails();
        return () => { mounted = false; };
    }, [selectedId, setSelectedLead]);

	return (
		<>
			<h1 className="text-3xl font-bold mb-4">Leads</h1>

			<div className="mb-4 flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<input
						value={filter}
						onChange={(e) => {
							setFilter(e.target.value);
							setPage(1);
						}}
						placeholder="Search leads (name, city, etc.)"
						className="px-3 py-2 border rounded w-64 bg-white dark:bg-gray-800"
					/>
					<button
						onClick={() => {
							setFilter("");
							setPage(1);
						}}
						className="text-sm text-gray-500"
					>
						Clear
					</button>
				</div>
				<div className="text-sm text-gray-500">
					Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
				</div>
			</div>

			<ManageLeadsActions page={page} setPage={setPage} total={total} pageSize={PAGE_SIZE} />

			<div className="h-[72vh]">
				<section className="bg-white dark:bg-gray-800 rounded shadow p-4 overflow-y-auto h-full" ref={listRef}>
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-semibold">Leads</h2>
						<div className="text-sm text-gray-500">Showing {leads.length} of {total}</div>
					</div>
					<div className="space-y-2">
						{loading && <p className="text-sm text-gray-500">Loading…</p>}
						{error && <p className="text-sm text-red-500">{error}</p>}
						{!loading && !error &&
							filteredLeads
								.map((lead) => (
									<div key={lead.id} id={`lead-${lead.id}`} className="mb-3">
										<LeadCard lead={lead} noNavigate={true} />
										{selectedLead?.id === lead.id && (
											<div className="mt-4">
												<LeadSummaryCard lead={selectedLead} fallback={{ businessName: lead.company_name }} />
											</div>
										)}
									</div>
								))}
						{!loading && !error && filteredLeads.length === 0 && (
							<p className="text-sm text-gray-500">No leads match the current filter.</p>
						)}
					</div>
				</section>
			</div>
			
			{/* Tab controls */}
			<div className="mt-3 flex gap-2">
				<button className={`px-3 py-1 rounded ${status==='all'?'bg-blue-600 text-white':'bg-white'}`} onClick={()=>setStatus('all')}>All</button>
				<button className={`px-3 py-1 rounded ${status==='interested'?'bg-blue-600 text-white':'bg-white'}`} onClick={()=>setStatus('interested')}>Interested</button>
				<button className={`px-3 py-1 rounded ${status==='discarded'?'bg-blue-600 text-white':'bg-white'}`} onClick={()=>setStatus('discarded')}>Not Interested</button>
			</div>
		</>
	);
};

export default LeadsPage;
