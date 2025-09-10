'use client';

import React, { createContext, useContext, useState } from 'react';

export type SelectedLead = {
  id: number;
  company_name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  industry?: string | null;
  contact?: string | null;
  slug?: string;
};

type SelectedLeadContextType = {
  selectedLead: SelectedLead | null;
  setSelectedLead: (lead: SelectedLead | null) => void;
};

const SelectedLeadContext = createContext<SelectedLeadContextType>({
  selectedLead: null,
  setSelectedLead: () => {},
});

export function SelectedLeadProvider({ children }: { children: React.ReactNode }) {
  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  return (
    <SelectedLeadContext.Provider value={{ selectedLead, setSelectedLead }}>
      {children}
    </SelectedLeadContext.Provider>
  );
}

export function useSelectedLead() {
  return useContext(SelectedLeadContext);
}
