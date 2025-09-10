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
  address?: string; // added: optional full address for maps
  interested?: boolean | null; // added: fallback interested state
  phoneScript?: string;
  emailScript?: string;
  generatedAt?: string;
};

export default function ClientLeadSummary({ fallback }: { fallback: SummaryFallback }) {
  const { selectedLead } = useSelectedLead();

  const businessName = selectedLead?.company_name ?? fallback.businessName;

  // Avoid showing sender env values (YOUR_EMAIL/YOUR_PHONE/YOUR_WEBSITE) as lead data
  const senderEmail = process.env.YOUR_EMAIL || '';
  const senderPhone = process.env.YOUR_PHONE || '';
  const senderWebsite = process.env.YOUR_WEBSITE || '';

  const sanitize = (value: string | undefined | null, senderValue: string) => {
    if (!value) return undefined;
    if (senderValue && value.trim() === senderValue.trim()) return undefined;
    return value;
  };

  const phone = sanitize(selectedLead?.phone ?? fallback.phone, senderPhone);
  const email = sanitize(selectedLead?.email ?? fallback.email, senderEmail);
  const website = sanitize((selectedLead?.website as string | undefined) ?? fallback.website, senderWebsite);
  const city = selectedLead?.city ?? fallback.city;
  const industry = selectedLead?.industry ?? fallback.industry;
  const contact = selectedLead?.contact ?? fallback.contact;
  const address = selectedLead?.address ?? fallback.address; // pass full address when available
  const interested = (selectedLead && typeof selectedLead.interested !== 'undefined') ? selectedLead.interested : (fallback.interested as boolean | null | undefined) ?? null;
  const leadId = selectedLead?.id ?? undefined;

  return (
    <LeadSummary
      businessName={businessName}
      phone={phone}
      email={email}
      website={website}
      city={city}
      industry={industry}
      contact={contact}
      address={address}
      leadId={leadId}
      interested={interested}
      emailScript={fallback.emailScript}
      phoneScript={fallback.phoneScript}
      generatedAt={fallback.generatedAt}
    />
  );
}
