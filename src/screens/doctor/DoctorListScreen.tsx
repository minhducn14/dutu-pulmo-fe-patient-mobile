import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { usePublicDoctors } from '@/hooks/useAppointments';

export function DoctorListScreen() {
  const router = useRouter();
  const doctorsQuery = usePublicDoctors({ page: 1, limit: 20 });

  if (doctorsQuery.isLoading) {
    return <Loading label="Loading doctors..." />;
  }

  if (doctorsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState title="Unable to load doctors" description="Please try again later." />
      </View>
    );
  }

  const doctors = doctorsQuery.data?.items ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Book a doctor</Text>
      <Text className="mt-1 text-slate-500">Choose the doctor that fits your needs</Text>

      <View className="mt-4 gap-3">
        {doctors.length === 0 ? (
          <EmptyState title="No doctors found" description="No doctor data is currently available." />
        ) : (
          doctors.map((doctor) => (
            <Card key={doctor.id}>
              <View className="flex-row items-center gap-3">
                <Avatar uri={doctor.avatarUrl} size={52} />
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">{doctor.fullName || 'Doctor'}</Text>
                  <Text className="text-sm text-blue-600">{doctor.specialty || 'Specialist'}</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {doctor.address || doctor.primaryHospital?.address || 'Address is being updated'}
                  </Text>
                </View>
              </View>
              <View className="mt-3">
                <Button title="Book now" onPress={() => router.push(`/doctors/${doctor.id}`)} />
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

export default DoctorListScreen;
