// src/components/QueryProvider.tsx
// TanStack Query provider. Wraps the app so all components can use useQuery/useMutation.

"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create the QueryClient once per component lifetime (not module-level,
  // to avoid sharing state between SSR requests).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            60 * 1000,  // 1 minute default
            gcTime:               5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry:                1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
