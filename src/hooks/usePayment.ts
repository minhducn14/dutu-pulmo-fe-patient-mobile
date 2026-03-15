import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';

export function useCreatePayment() {
  return useMutation({
    mutationFn: (appointmentId: string) =>
      paymentService.createPayment(appointmentId),
  });
}

export function usePaymentStatusOnce(appointmentId: string) {
  return useQuery({
    queryKey: ['payment-fallback', appointmentId],
    queryFn: () => paymentService.getPaymentByAppointment(appointmentId),
    enabled: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
}

export function useCancelPayment() {
  return useMutation({
    mutationFn: ({
      appointmentId,
      reason,
    }: {
      appointmentId: string;
      reason?: string;
    }) => paymentService.cancelPayment(appointmentId, reason),
  });
}
