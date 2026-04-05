
import { QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const queryClient = new QueryClient({ // global config
  defaultOptions: { // default behavior for queries & mutations
    queries: {
     // Performance improve and Memory optimization
      staleTime: 1000 * 60 * 2,   // 2 min
      gcTime:    1000 * 60 * 10,  // 10 min
      retry: (count, err) => {
        if (err?.response?.status === 401) return false; // if 401 no retry
        return count < 2; // max 2 retries
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Something went wrong");
      },
    },
  },
})