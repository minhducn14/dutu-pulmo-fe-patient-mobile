import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useForgotPassword } from '@/hooks/useForgotPassword';
import { useResendOtp } from '@/hooks/useResendOtp';
import { useVerifyOtp } from '@/hooks/useVerifyOtp';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 59;

export function VerifyOtpScreen() {
  const router = useRouter();
  const { email, mode } = useLocalSearchParams<{
    email: string;
    mode?: 'verify' | 'reset';
  }>();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();
  const forgotPasswordMutation = useForgotPassword();

  const isLoading =
    verifyOtpMutation.isPending ||
    resendOtpMutation.isPending ||
    forgotPasswordMutation.isPending;

  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const maskEmail = (raw: string) => {
    if (!raw) return '';
    const [local, domain] = raw.split('@');
    if (!domain) return raw;
    const visible = local.slice(0, 2);
    const stars = '*'.repeat(Math.max(local.length - 2, 0));
    return `${visible}${stars}@${domain}`;
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    if (index > 0 && otp[index - 1] === '') return;
    if (error) setError(null);
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    if (!email) {
      setError('Không tìm thấy email. Vui lòng thử lại.');
      return;
    }
    if (mode === 'reset') {
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email, otp: code },
      });
      return;
    }
    verifyOtpMutation.mutate(
      { email, otp: code },
      {
        onSuccess: () => router.replace('/(auth)/login'),
        onError: () => {
          setError('Mã OTP không hợp lệ hoặc đã hết hạn');
          setOtp(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        },
      },
    );
  };

  useEffect(() => {
    if (otp.every((d) => d !== '')) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = () => {
    if (!email) return;
    const onSuccess = () => {
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError(null);
      inputRefs.current[0]?.focus();
    };
    const onError = () => setError('Không thể gửi lại mã. Vui lòng thử lại.');
    if (mode === 'reset') {
      forgotPasswordMutation.mutate({ email }, { onSuccess, onError });
    } else {
      resendOtpMutation.mutate({ email }, { onSuccess, onError });
    }
  };

  return (
    <View 
      className="flex-1 bg-white px-6"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      <TouchableOpacity className="mb-6 self-start" onPress={() => router.back()}>
        <Text className="text-slate-500 text-base">← Quay lại</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-slate-900">Xác thực OTP</Text>
      <Text className="mt-2 text-slate-500">Mã xác thực đã được gửi đến</Text>
      <Text className="mt-1 font-semibold text-slate-800">
        {maskEmail(email ?? '')}
      </Text>

      <View className="mt-10 flex-row justify-between">
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            className={`w-[46px] h-[56px] rounded-2xl border-2 text-center text-2xl font-bold text-slate-900 ${digit ? 'border-[#0A7CFF] bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}
            value={digit}
            onChangeText={(v) => handleChange(v, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!isLoading}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? (
        <Text className="mt-4 text-center text-sm text-red-500">{error}</Text>
      ) : null}

      <View className="mt-8">
        <TouchableOpacity
          className="w-full items-center justify-center rounded-2xl bg-[#0A7CFF] py-4"
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Xác nhận</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-6 items-center">
        {canResend ? (
          <TouchableOpacity onPress={handleResend} disabled={isLoading}>
            <Text className="font-semibold text-[#0A7CFF]">Gửi lại mã OTP</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center gap-1">
            <Text className="text-slate-500 text-sm">Gửi lại sau </Text>
            <Text className="font-semibold text-[#0A7CFF] text-sm">{countdown}s</Text>
          </View>
        )}
      </View>

      <Text className="mt-3 text-center text-xs text-slate-400">
        Mã OTP có hiệu lực trong 5 phút
      </Text>
    </View>
  );
}

export default VerifyOtpScreen;