import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { usePendingPaymentAppointments } from '@/hooks/useAppointments';

export const PendingPaymentBanner: React.FC = () => {
  const router = useRouter();
  const { data } = usePendingPaymentAppointments();

  const appointments = data?.items ?? [];
  if (appointments.length === 0) return null;

  const count = data?.meta?.totalItems ?? appointments.length;
  const latestAppointment = appointments[0];

  return (
    <View
      className="mx-4 mb-4 overflow-hidden rounded-2xl bg-amber-50 border border-amber-100"
      style={{
        shadowColor: '#d97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="bg-amber-100 p-1.5 rounded-full">
              <MaterialIcons name="payment" size={16} color="#d97706" />
            </View>
            <Text className="text-amber-800 font-bold text-sm">
              Bạn có {count} lịch chờ thanh toán (Hạn 24h)
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/appointments')}
            activeOpacity={0.7}
          >
            <Text className="text-amber-600 font-semibold text-xs text-right">Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white/60 p-3 rounded-xl border border-amber-100/50 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>
              {latestAppointment.doctor?.fullName || 'Bác sĩ'}
            </Text>
            <Text className="text-slate-500 text-[10px] mt-0.5">
              {new Date(latestAppointment.scheduledAt).toLocaleDateString('vi-VN')} • {new Date(latestAppointment.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/appointments/payment?appointmentId=${latestAppointment.id}`)}
            activeOpacity={0.8}
            className="bg-amber-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-bold text-xs">Thanh toán ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PendingPaymentBanner;
