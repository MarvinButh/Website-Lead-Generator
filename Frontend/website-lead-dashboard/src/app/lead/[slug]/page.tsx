import path from "node:path";
import { promises as fs } from "node:fs";
import { notFound } from "next/navigation";
import { LeadSummary } from "@/components/LeadSummary";
import SideBar from "@/components/SideBar";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

export default async function LeadPage({ params }: PageProps) {
  const { slug } = params;

  const baseDir = path.resolve(process.cwd(), "../../Backend/offer-sheets", slug);

  // Ensure the directory for this slug exists
  try {
    await fs.access(baseDir);
  } catch {
    return notFound();
  }

  // Read metadata and scripts in parallel
  const [metaRaw, emailScriptRaw, phoneScriptRaw] = await Promise.all([
    fs.readFile(path.join(baseDir, "metadata.json"), "utf-8").catch(() => null),
    fs.readFile(path.join(baseDir, "cold_email.md"), "utf-8").catch(() => ""),
    fs.readFile(path.join(baseDir, "cold_phone_call.md"), "utf-8").catch(() => ""),
  ]);

  const meta = metaRaw ? JSON.parse(metaRaw) : null;

  const placeholders: Record<string, string> = meta?.placeholders ?? {};
  const normalize = (s: string) => s.toLowerCase().replace(/[{}\[\]\s_]/g, "");
  const pick = (keys: string[]) => {
    const wanted = new Set(keys.map(normalize));
    for (const [k, v] of Object.entries(placeholders)) {
      if (wanted.has(normalize(k))) return v;
    }
    return undefined;
  };

  const businessName: string = meta?.company ?? pick(["businessname", "firmenname"]) ?? slug;
  const phone = pick(["phone", "telefon"]);
  const email = pick(["email", "e-mail", "e_mail"]);
  const website = pick(["website", "webseite", "url"]);
  const city = pick(["city", "stadt"]);
  const industry = pick(["industry", "kategorie"]);
  const contact = pick(["owner/managername", "ansprechpartner", "name"]);
  const generatedAt = meta?.generated_at as string | undefined;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-7xl">
        <SideBar />
        <main className="flex-1 p-6">
          <LeadSummary
            businessName={businessName}
            phone={phone}
            email={email}
            website={website}
            city={city}
            industry={industry}
            contact={contact}
            emailScript={emailScriptRaw || undefined}
            phoneScript={phoneScriptRaw || undefined}
            generatedAt={generatedAt}
          />
        </main>
      </div>
    </div>
  );
}
