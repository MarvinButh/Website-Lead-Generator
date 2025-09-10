import LeadCard from "@/components/LeadCard";
import LeadSearchForm from "@/components/LeadSearchForm";
import ManageLeadsActions from "@/components/ManageLeadsActions";

export const dynamic = "force-dynamic";

type Lead = {
  id: number;
  company_name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  industry?: string | null;
  contact?: string | null;
};

const PAGE_SIZE = 30;

async function fetchLeads(page = 1, page_size = PAGE_SIZE): Promise<Lead[]> {
  const base = process.env.API_INTERNAL_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(page_size));
  const url = `${base}/leads?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch /leads:", res.status, res.statusText);
    return [];
  }
  const j = await res.json();
  // Support both legacy array response and new { items, total } shape
  if (Array.isArray(j)) return j as Lead[];
  if (j && Array.isArray(j.items)) return j.items as Lead[];
  return [];
}

export default async function Home({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const rawPage = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const page = Number(rawPage || '1') || 1;

  const leads = await fetchLeads(page);

  // helpers to build links (preserve only page param here)
  const buildHref = (p: number) => {
    if (p <= 1) return '/';
    return `/?page=${p}`;
  };

  const hasNext = leads.length >= PAGE_SIZE;

  return (
    <>
      <h1 className="text-3xl font-bold">Website Lead Dashboard</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Welcome to the Website Lead Dashboard. Here you can find all the information about your leads.
      </p>

      <LeadSearchForm />
      <div className="flex items-center mt-4">
        <ManageLeadsActions />
        <div className="ml-auto flex items-center gap-2">
          {page > 1 ? (
            <a href={buildHref(page - 1)} className="rounded px-3 py-1 bg-white border text-sm">Prev</a>
          ) : (
            <button disabled className="rounded px-3 py-1 bg-gray-100 border text-sm text-gray-400">Prev</button>
          )}

          <div className="text-sm text-gray-600">Page {page}</div>

          {hasNext ? (
            <a href={buildHref(page + 1)} className="rounded px-3 py-1 bg-white border text-sm">Next</a>
          ) : (
            <button disabled className="rounded px-3 py-1 bg-gray-100 border text-sm text-gray-400">Next</button>
          )}
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map((l) => (
          <li key={l.id}>
            <LeadCard lead={l} />
          </li>
        ))}
        {leads.length === 0 && (
          <li className="text-sm text-gray-500 dark:text-gray-400">No leads found.</li>
        )}
      </ul>

      <footer className="mt-10 border-t border-gray-200 p-4 text-center dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Marvin Buth. All rights reserved.
        </p>
      </footer>
    </>
  );
}
