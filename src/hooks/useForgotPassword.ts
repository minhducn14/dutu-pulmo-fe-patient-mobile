import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import type { ForgotPasswordDto } from '@/types/auth.types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordDto) =>
      authService.forgotPasswordOtp(payload),
  });
}
