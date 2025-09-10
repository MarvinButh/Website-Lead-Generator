import SideBar from "@/components/SideBar";
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

async function fetchLeads(): Promise<Lead[]> {
  const base = process.env.API_INTERNAL_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const res = await fetch(`${base}/leads`, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch /leads:", res.status, res.statusText);
    return [];
  }
  return (await res.json()) as Lead[];
}

export default async function Home() {
  const leads = await fetchLeads();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-7xl">
        <SideBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold">Website Lead Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Welcome to the Website Lead Dashboard. Here you can find all the information about your leads.
          </p>

          <LeadSearchForm />
          <ManageLeadsActions />

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
        </main>
      </div>
    </div>
  );
}
