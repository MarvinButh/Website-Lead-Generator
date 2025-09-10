import path from "node:path";
import { promises as fs } from "node:fs";
import SideBar from "@/components/SideBar";
import ClientLeadSummary from "@/components/ClientLeadSummary";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

export default async function LeadPage({ params }: PageProps) {
  const { slug } = await params;

  // Allow override via env for Docker/prod; default to monorepo path
  const offersRoot = process.env.OFFER_SHEETS_DIR || path.resolve(process.cwd(), "../../Backend/offer-sheets");

  const resolveBaseDir = async (): Promise<string> => {
    const lc = slug.toLowerCase();
    const direct = path.join(offersRoot, lc);
    try {
      await fs.access(direct);
      return direct;
    } catch {}
    // Fallback: scan for a directory whose lowercased name matches the slug (covers older generations)
    try {
      const entries = await fs.readdir(offersRoot, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory() && ent.name.toLowerCase() === lc) {
          const candidate = path.join(offersRoot, ent.name);
          try {
            await fs.access(candidate);
            return candidate;
          } catch {}
        }
      }
    } catch {}
    return direct; // default path (may not exist yet)
  };

  let baseDir = await resolveBaseDir();

  const readAssets = async (dir: string) => {
    const [metaRaw, emailScriptRaw, phoneScriptRaw] = await Promise.all([
      fs.readFile(path.join(dir, "metadata.json"), "utf-8").catch(() => null),
      fs.readFile(path.join(dir, "cold_email.md"), "utf-8").catch(() => ""),
      fs.readFile(path.join(dir, "cold_phone_call.md"), "utf-8").catch(() => ""),
    ]);
    return { metaRaw, emailScriptRaw, phoneScriptRaw } as const;
  };

  let { metaRaw, emailScriptRaw, phoneScriptRaw } = await readAssets(baseDir);

  // Trigger generation if metadata is missing OR both scripts missing
  if (!metaRaw || (!emailScriptRaw && !phoneScriptRaw)) {
    try {
      const base = process.env.API_INTERNAL_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      await fetch(`${base}/leads/${slug}/generate-assets`, { method: "POST", cache: "no-store" });
      // Re-resolve baseDir in case a new lowercase directory was created
      baseDir = await resolveBaseDir();
      // Retry read after generation
      const res2 = await readAssets(baseDir);
      metaRaw = res2.metaRaw;
      emailScriptRaw = res2.emailScriptRaw;
      phoneScriptRaw = res2.phoneScriptRaw;
    } catch {
      // ignore
      console.log("Error generating assets");
    }
  }

  const meta = metaRaw ? JSON.parse(metaRaw) : null;

  const placeholders: Record<string, string> = meta?.placeholders ?? {};
  const normalize = (s: string) => s.toLowerCase().replace(/[{}\[\]\s_]/g, "");
  const pick = (keys: string[]) => {
    const wanted = new Set(keys.map(normalize));
    for (const [k, v] of Object.entries(placeholders)) {
      if (wanted.has(normalize(k))) return v as string;
    }
    return undefined;
  };

  const businessName: string = meta?.company ?? pick(["businessname", "firmenname"]) ?? slug;
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
              emailScript: emailScriptRaw || undefined,
              phoneScript: phoneScriptRaw || undefined,
              generatedAt,
            }}
          />
        </main>
      </div>
    </div>
  );
}
