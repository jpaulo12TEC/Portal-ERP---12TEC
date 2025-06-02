"use client";

import { useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/auth-helpers-nextjs";

interface Props {
  children: React.ReactNode;
  initialSession: Session | null;
}

export default function SupabaseProvider({ children, initialSession }: Props) {
  const [supabaseClient] = useState(() => createClientComponentClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
