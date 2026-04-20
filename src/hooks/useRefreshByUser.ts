import { useState, useCallback } from 'react';

/**
 * A custom hook to handle the boolean `refreshing` state and standard execution of a React Query refetch method.
 *
 * @param refetch A promise-returning function normally from React Query (e.g. `refetch` from `useQuery`).
 * @returns An object containing `refreshing` boolean and `onRefresh` function to pass to `<RefreshControl />`.
 */
export function useRefreshByUser(refetch: () => Promise<any>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return {
    refreshing,
    onRefresh,
  };
}
