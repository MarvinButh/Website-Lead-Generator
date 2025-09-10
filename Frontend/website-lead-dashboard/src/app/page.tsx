import SideBar from "@/components/SideBar";

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

          <ul className="mt-6 space-y-3">
            {leads.map((l) => (
              <li key={l.id} className="rounded border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{l.company_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {[l.city, l.industry, l.email, l.phone].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {leads.length === 0 && (
              <li className="text-sm text-gray-500 dark:text-gray-400">No leads found.</li>
            )}
          </ul>

          <footer className="mt-10 border-t border-gray-200 p-4 text-center dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Website Lead Dashboard. All rights reserved.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
