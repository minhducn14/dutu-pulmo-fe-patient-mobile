import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import type { ResendVerificationDto } from '@/types/auth.types';

/**
 * Gửi lại mã OTP xác thực email (rate-limited: 1 lần/phút).
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: (payload: ResendVerificationDto) =>
      authService.resendOtp(payload),
  });
}
