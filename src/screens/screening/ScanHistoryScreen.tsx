import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { permissions } from '@/constants/permissions';

export function ScanHistoryScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Lịch sử phân tích AI</Text>
      <Text className="mt-1 text-slate-500">
        Ứng dụng bệnh nhân chỉ hiển thị dữ liệu AI khi backend cho phép truy cập theo role PATIENT.
      </Text>

      <View className="mt-4 gap-3">
        <Card>
          <Text className="text-base font-bold text-slate-900">Trạng thái quyền truy cập</Text>
          <Text className="mt-2 text-sm text-slate-600">
            Tạo yêu cầu phân tích: {permissions.screening.canCreateRequest ? 'Được phép' : 'Không được phép'}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            Upload ảnh: {permissions.screening.canUploadImage ? 'Được phép' : 'Không được phép'}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            Xem danh sách screening: {permissions.screening.canListAllRequests ? 'Được phép' : 'Không được phép'}
          </Text>
        </Card>

        <EmptyState
          title="Chế độ chỉ đọc"
          description="Để tránh lỗi Forbidden từ backend, các thao tác tạo/upload screening đã được ẩn ở tài khoản bệnh nhân."
        />
      </View>
    </ScrollView>
  );
}

export default ScanHistoryScreen;
