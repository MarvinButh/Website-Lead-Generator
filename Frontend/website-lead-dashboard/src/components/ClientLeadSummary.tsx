'use client';

import { LeadSummary } from '@/components/LeadSummary';
import { useSelectedLead } from '@/context/SelectedLeadContext';

export type SummaryFallback = {
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  industry?: string;
  contact?: string;
  phoneScript?: string;
  emailScript?: string;
  generatedAt?: string;
};

export default function ClientLeadSummary({ fallback }: { fallback: SummaryFallback }) {
  const { selectedLead } = useSelectedLead();

  const businessName = selectedLead?.company_name ?? fallback.businessName;
  const phone = selectedLead?.phone ?? fallback.phone;
  const email = selectedLead?.email ?? fallback.email;
  const website = (selectedLead?.website as string | undefined) ?? fallback.website;
  const city = selectedLead?.city ?? fallback.city;
  const industry = selectedLead?.industry ?? fallback.industry;
  const contact = selectedLead?.contact ?? fallback.contact;

  return (
    <LeadSummary
      businessName={businessName}
      phone={phone}
      email={email}
      website={website}
      city={city}
      industry={industry}
      contact={contact}
      emailScript={fallback.emailScript}
      phoneScript={fallback.phoneScript}
      generatedAt={fallback.generatedAt}
    />
  );
}
