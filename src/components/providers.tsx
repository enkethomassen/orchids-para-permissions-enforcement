"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ParaProvider } from "@getpara/react-sdk";
import { Environment } from "@getpara/react-sdk";
import "@getpara/react-sdk/styles.css";
import { useState } from "react";

const PARA_API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY!;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey: PARA_API_KEY,
          env: Environment.BETA,
        }}
        config={{
          appName: "Allowance Wallet",
          disableEmbeddedModal: false,
        }}
      >
        {children}
      </ParaProvider>
    </QueryClientProvider>
  );
}
