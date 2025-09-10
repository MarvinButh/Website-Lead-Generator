"use client";

import { useRouter } from "next/navigation";
import { useSelectedLead } from "@/context/SelectedLeadContext";
import { slugify } from "@/lib/slug";

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

export default function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  const { setSelectedLead } = useSelectedLead();

  const slug = slugify(lead.company_name);

  const onClick = () => {
    setSelectedLead({ ...lead, slug });
    router.push(`/lead/${slug}`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 shadow-sm transition hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
    >
      <div className="font-medium truncate">{lead.company_name}</div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
        {[lead.city, lead.industry, lead.email, lead.phone].filter(Boolean).join(" • ")}
      </div>
    </button>
  );
}
