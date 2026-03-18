import { useCallback } from 'react';

import { removeFcmTokenBestEffort } from '@/services/fcm.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // backend allows expired token on logout guard; ignore logout error
    } finally {
      await removeFcmTokenBestEffort();
      clearSession();
    }
  }, [clearSession]);
}
