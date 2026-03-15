// src/hooks/usePaymentSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

type PaymentStatus = 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';

export function usePaymentSocket(
  appointmentId: string | undefined,
  onStatusChange: (status: PaymentStatus) => void,
) {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!appointmentId || !accessToken) return;

    const socket: Socket = io(`${process.env.EXPO_PUBLIC_API_URL}/payment`, {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socket.on('connect', () => {
      socket.emit('join_payment', appointmentId);
    });

    socket.on('payment_status', ({ status }: { status: PaymentStatus }) => {
      onStatusChange(status);
    });

    socket.on('exception', (err: { message: string }) => {
      console.warn('[PaymentSocket] error:', err.message);
    });

    socket.on('connect_error', (err) => {
      console.warn('[PaymentSocket] connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [appointmentId, accessToken]);
}
