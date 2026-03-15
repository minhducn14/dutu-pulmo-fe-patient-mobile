import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import type { VerifyOtpDto } from '@/types/auth.types';

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload: VerifyOtpDto) => authService.verifyOtp(payload),
  });
}
