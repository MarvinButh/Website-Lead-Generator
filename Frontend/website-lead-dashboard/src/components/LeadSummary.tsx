import React from "react";

export type LeadSummaryProps = {
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  industry?: string;
  contact?: string;
  phoneScript?: string; // contents of cold_phone_call.md
  emailScript?: string; // contents of cold_email.md
  generatedAt?: string;
};

export function LeadSummary({
  businessName,
  phone,
  email,
  website,
  city,
  industry,
  contact,
  phoneScript,
  emailScript,
  generatedAt,
}: LeadSummaryProps) {
  const phoneHref = phone ? `tel:${phone.replace(/[^0-9+]+/g, "")}` : "";
  const emailHref = email ? `mailto:${email}` : "";
  const websiteHref = website && !/^https?:\/\//i.test(website) ? `http://${website}` : website || "";

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-xl">
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{businessName}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lead summary</p>

            <div className="mt-6 grid gap-3 text-gray-800 dark:text-gray-100">
              {(phone || phoneHref) && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>{" "}
                  {phoneHref ? (
                    <a className="text-blue-600 dark:text-blue-400 hover:underline" href={phoneHref}>
                      {phone}
                    </a>
                  ) : (
                    <span>{phone}</span>
                  )}
                </div>
              )}

              {(email || emailHref) && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>{" "}
                  {emailHref ? (
                    <a className="text-blue-600 dark:text-blue-400 hover:underline" href={emailHref}>
                      {email}
                    </a>
                  ) : (
                    <span>{email}</span>
                  )}
                </div>
              )}

              {(website || websiteHref) && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Website:</span>{" "}
                  {websiteHref ? (
                    <a
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={websiteHref}
                    >
                      {website}
                    </a>
                  ) : (
                    <span>{website}</span>
                  )}
                </div>
              )}
            </div>

            {(contact || city || industry) && (
              <ul className="mt-6 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                {contact && (
                  <li>
                    <span className="font-medium">Contact:</span> {contact}
                  </li>
                )}
                {city && (
                  <li>
                    <span className="font-medium">City:</span> {city}
                  </li>
                )}
                {industry && (
                  <li>
                    <span className="font-medium">Industry:</span> {industry}
                  </li>
                )}
              </ul>
            )}

            <div className="mt-6 space-y-3">
              {emailScript && (
                <details className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">
                    Cold email (click to expand)
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-800 dark:text-gray-100 font-mono overflow-x-auto">
                    {emailScript}
                  </pre>
                </details>
              )}

              {phoneScript && (
                <details className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">
                    Cold phone script (click to expand)
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-800 dark:text-gray-100 font-mono overflow-x-auto">
                    {phoneScript}
                  </pre>
                </details>
              )}
            </div>

            {generatedAt && (
              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">Generated {generatedAt}</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LeadSummary;
