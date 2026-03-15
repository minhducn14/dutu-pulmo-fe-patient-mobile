import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListItem } from '@/components/ui/ListItem';
import { Loading } from '@/components/ui/Loading';
import { useMyPatient, useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/auth.store';

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const myPatientQuery = useMyPatient();
  const profileQuery = useProfile();

  if (myPatientQuery.isLoading || profileQuery.isLoading) {
    return <Loading label="Loading profile..." />;
  }

  if (myPatientQuery.isError || profileQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6">
        <EmptyState title="Unable to load account" description="Please try again later." />
      </View>
    );
  }

  const profile = profileQuery.data;

  return (
    <ScrollView className="flex-1 bg-background-light" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Card>
        <View className="flex-row items-center gap-3">
          <Avatar uri={user?.avatarUrl} size={56} />
          <View>
            <Text className="text-lg font-bold text-slate-900">{user?.fullName || 'User'}</Text>
            <Text className="text-sm text-slate-500">{myPatientQuery.data?.profileCode || 'No patient code yet'}</Text>
          </View>
        </View>
      </Card>

      <Text className="mt-5 text-lg font-bold text-slate-900">Tài khoản</Text>
      <View className="mt-2 gap-2">
        <ListItem title="Hồ sơ y tế" subtitle="Xem hồ sơ và đơn thuốc" onPress={() => router.push('/medical-records')} />
        <ListItem title="Đơn thuốc" subtitle="Lịch sử kê đơn" onPress={() => router.push('/prescriptions')} />
        <ListItem title="Báo cáo của tôi" subtitle="Theo dõi phản ánh đã gửi" onPress={() => router.push('/reports')} />
        <ListItem title="Gửi báo cáo" subtitle="Báo cáo bác sĩ/lịch khám" onPress={() => router.push('/reports/new')} />
      </View>

      <Text className="mt-5 text-lg font-bold text-slate-900">Khác</Text>
      <View className="mt-2 gap-2">
        <ListItem title="Thông báo" subtitle="Danh sách thông báo" onPress={() => router.push('/notifications')} />
        <ListItem title="Cài đặt" subtitle="Tùy chọn tài khoản" onPress={() => router.push('/settings')} />
        <ListItem
          title="Đăng xuất"
          subtitle="Kết thúc phiên đăng nhập"
          onPress={() => {
            clearSession();
            console.log('Redirecting to login in ProfileScreen');
          }}
        />
      </View>

      <Card className="mt-4">
        <Text className="text-base font-bold text-slate-900">Tổng quan sức khỏe</Text>
        <Text className="mt-2 text-sm text-slate-600">Tổng hồ sơ bệnh án: {profile?.summary.totalMedicalRecords ?? 0}</Text>
        <Text className="mt-1 text-sm text-slate-600">Tổng chỉ số sinh hiệu: {profile?.summary.totalVitalSigns ?? 0}</Text>
        <Text className="mt-1 text-sm text-slate-600">Tổng đơn thuốc: {profile?.summary.totalPrescriptions ?? 0}</Text>
      </Card>
    </ScrollView>
  );
}

export default ProfileScreen;

