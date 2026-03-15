import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import type { ResetPasswordWithOtpDto } from '@/types/auth.types';

/**
 * Đặt lại mật khẩu bằng OTP nhận qua email.
 * Tự động thu hồi toàn bộ refresh token sau khi đổi mật khẩu thành công.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordWithOtpDto) =>
      authService.resetPasswordOtp(payload),
  });
}
