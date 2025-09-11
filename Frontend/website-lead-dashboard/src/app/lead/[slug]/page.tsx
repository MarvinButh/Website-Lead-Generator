import ClientLeadSummary from "@/components/ClientLeadSummary";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

type AssetSummary = {
  ok: boolean;
  meta: Record<string, unknown> | null;
  emailScript: string;
  phoneScript: string;
};

export default async function LeadPage({ params }: PageProps) {
  const { slug } = await params;

  // Prefer internal base for server-to-server calls on Vercel. Fallback to proxy base.
  const base = process.env.API_INTERNAL_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  // Ask backend for a summary of generated assets; backend will attempt generation if missing
  let meta: Record<string, unknown> | null = null;
  let emailScript = "";
  let phoneScript = "";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/assets/${slug}/summary`, { cache: "no-store" });
    if (res.ok) {
      const j = (await res.json()) as AssetSummary;
      if (j && typeof j === "object") {
        meta = (j.meta as Record<string, unknown> | null) ?? null;
        emailScript = j.emailScript || "";
        phoneScript = j.phoneScript || "";
      }
    }
  } catch {
    // ignore
  }

  const placeholders: Record<string, string> = (meta?.placeholders as Record<string, string> | undefined) ?? {};
  const normalize = (s: string) => s.toLowerCase().replace(/[{}\[\]\s_]/g, "");
  const pick = (keys: string[]) => {
    const wanted = new Set(keys.map(normalize));
    for (const [k, v] of Object.entries(placeholders)) {
      if (wanted.has(normalize(k))) return v as string;
    }
    return undefined;
  };

  const businessName: string = (meta?.company as string | undefined) ?? pick(["businessname", "firmenname"]) ?? slug;
  let phone = pick(["phone", "telefon"]);
  let email = pick(["email", "e-mail", "e_mail"]);
  let website = pick(["website", "webseite", "url"]);
  const city = pick(["city", "stadt"]);
  const industry = pick(["industry", "kategorie"]);
  const contact = pick(["owner/managername", "ansprechpartner", "name"]);
  const address = pick(["address", "adresse", "anschrift", "streetaddress", "straße", "strasse"]);
  const generatedAt = (meta?.generated_at as string | undefined) ?? undefined;

  // Sanitize fallbacks: do not show sender env values (YOUR_EMAIL/YOUR_PHONE/YOUR_WEBSITE) as lead data
  const senderEmail = process.env.YOUR_EMAIL || "";
  const senderPhone = process.env.YOUR_PHONE || "";
  const senderWebsite = process.env.YOUR_WEBSITE || "";

  const normalizeUrl = (u?: string | undefined) => {
    if (!u) return "";
    return u.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
  };

  if (email && senderEmail && email.trim() === senderEmail.trim()) {
    email = undefined;
  }
  if (phone && senderPhone && phone.trim() === senderPhone.trim()) {
    phone = undefined;
  }
  if (website && senderWebsite && normalizeUrl(website) === normalizeUrl(senderWebsite)) {
    website = undefined;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-7xl">
        <main className="flex-1 p-6">
          <ClientLeadSummary
            fallback={{
              businessName,
              phone,
              email,
              website,
              address,
              city,
              industry,
              contact,
              interested: null,
              emailScript: emailScript || undefined,
              phoneScript: phoneScript || undefined,
              generatedAt,
            }}
          />
        </main>
      </div>
    </div>
  );
}
