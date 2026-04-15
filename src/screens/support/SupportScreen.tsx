import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import ScreenHeader from '@/components/ui/ScreenHeader';

// ─── Danh mục hỗ trợ ──────────────────────────────────────────────────────────
const SUPPORT_CATEGORIES = [
  {
    icon: 'auto-awesome' as const,
    label: 'Hỏi Trợ lý\nAI',
    sublabel: 'TƯ VẤN 24/7',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    route: '/support/ai-chatbot' as const,
  },
  {
    icon: 'calendar-today' as const,
    label: 'Đặt lịch\nkhám',
    sublabel: 'TELEHEALTH',
    color: '#0A7CFF',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    icon: 'medical-services' as const,
    label: 'Tư vấn\ny tế',
    sublabel: 'BÁC SĨ CHUYÊN KHOA',
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  {
    icon: 'settings' as const,
    label: 'Kỹ thuật\nứng dụng',
    sublabel: 'SỬ DỤNG APP',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    icon: 'calendar-today' as const,
    title: 'Cách đặt lịch khám?',
    description:
      'Chọn bác sĩ → Chọn khung giờ → Xác nhận → Thanh toán. Chỉ vài bước đơn giản.',
    color: '#0A7CFF',
    bg: '#EFF6FF',
  },
  {
    icon: 'payment' as const,
    title: 'Phương thức thanh toán?',
    description:
      'Hỗ trợ thanh toán QR Code qua các ứng dụng ngân hàng và ví điện tử.',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  {
    icon: 'sync' as const,
    title: 'Huỷ lịch & hoàn tiền?',
    description:
      'Bạn có thể huỷ lịch trước 24 giờ. Tiền hoàn trong 3-5 ngày làm việc.',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
  {
    icon: 'video-call' as const,
    title: 'Tư vấn trực tuyến?',
    description:
      'Tính năng tư vấn video call đang được phát triển và sẽ sớm ra mắt.',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    icon: 'folder-open' as const,
    title: 'Xem Hồ sơ bệnh án?',
    description:
      'Vào Tài khoản → Hồ sơ bệnh án để xem toàn bộ lịch sử khám và đơn thuốc.',
    color: '#0A7CFF',
    bg: '#EFF6FF',
  },
  {
    icon: 'lock' as const,
    title: 'Bảo mật thông tin?',
    description:
      'Dữ liệu mã hóa theo chuẩn SSL/TLS, tuân thủ quy định bảo mật y tế.',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
export function SupportScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<
    number | null
  >(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  const handleCall = () => Linking.openURL('tel:19002805');
  const handleChat = () => router.push('/(tabs)/chat');
  const selectedCategory =
    selectedCategoryIndex == null
      ? null
      : SUPPORT_CATEGORIES[selectedCategoryIndex];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* ── HEADER ── */}
      <ScreenHeader title="Hỗ trợ" hideBack={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── GREETING CARD ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            borderWidth: 0.5,
            borderColor: '#E2E8F0',
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          {/* Avatar + greeting */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="support-agent" size={28} color="#0A7CFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}
              >
                {greeting}, {firstName} 👋
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Bạn cần hỗ trợ điều gì hôm nay?
              </Text>
            </View>
          </View>

          {/* Info box */}
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              <MaterialIcons
                name="medical-services"
                size={16}
                color="#0A7CFF"
              />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: '#475569',
                lineHeight: 20,
              }}
            >
              Nếu bạn cần hỗ trợ đặt lịch khám, tư vấn y tế hay hướng dẫn hệ
              thống, hãy chọn cách kết nối bên dưới nhé:
            </Text>
          </View>

          {/* Hours badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F0FDF4',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
              borderWidth: 0.5,
              borderColor: '#BBF7D0',
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#16A34A',
                }}
              />
              <Text
                style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}
              >
                Đội ngũ sẵn sàng
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{ fontSize: 10, fontWeight: '700', color: '#15803D' }}
              >
                THỨ 2 - THỨ 7
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}
              >
                08:00 - 17:30
              </Text>
            </View>
          </View>

          {/* CTA buttons */}
          <TouchableOpacity
            onPress={handleChat}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#0A7CFF',
              borderRadius: 14,
              paddingVertical: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 10,
              shadowColor: '#0A7CFF',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <MaterialIcons name="chat-bubble" size={18} color="white" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>
              Trò chuyện cùng chuyên viên
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            activeOpacity={0.85}
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <MaterialIcons name="phone" size={18} color="#334155" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>
              Gọi tổng đài 1900-2805
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: '#94A3B8',
              marginTop: 12,
              fontStyle: 'italic',
            }}
          >
            Sức khoẻ của bạn là ưu tiên hàng đầu của Dutu Pulmo.
          </Text>
        </View>

        {/* ── DANH MỤC HỖ TRỢ ── */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#0F172A',
              marginBottom: 12,
            }}
          >
            Chọn chủ đề cần hỗ trợ
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {SUPPORT_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  if (cat.route) {
                    router.push(cat.route as any);
                  } else {
                    setSelectedCategoryIndex(idx);
                  }
                }}
                activeOpacity={0.85}
                style={{
                  width: '47.5%',
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: cat.border,
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: cat.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <MaterialIcons name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#0F172A',
                    lineHeight: 20,
                    marginBottom: 4,
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{ fontSize: 10, fontWeight: '600', color: cat.color }}
                >
                  {cat.sublabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CÂU HỎI THƯỜNG GẶP ── */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#0F172A',
              marginBottom: 12,
            }}
          >
            Câu hỏi thường gặp
          </Text>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: '#E2E8F0',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            {FAQ_ITEMS.map((item, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: idx < FAQ_ITEMS.length - 1 ? 0.5 : 0,
                  borderBottomColor: '#F1F5F9',
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: item.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={15}
                    color={item.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#0F172A',
                      marginBottom: 3,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── BÁO CÁO SỰ CỐ ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: '#FEF2F2',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: '#FECACA',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="report-problem" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}
              >
                Gặp sự cố?
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                Báo cáo vấn đề về bác sĩ hoặc ứng dụng
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/reports/new')}
            activeOpacity={0.85}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <MaterialIcons name="edit" size={15} color="#DC2626" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>
              Gửi báo cáo sự cố
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── FOOTER ── */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ fontSize: 11, color: '#CBD5E1' }}>
            DuTu Pulmo • Phiên bản 1.0.0
          </Text>
          <Text style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>
            © 2025 DuTu Health. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedCategoryIndex !== null}
        onRequestClose={() => setSelectedCategoryIndex(null)}
      >
        <View
          style={{
            margin: 20,
            borderRadius: 20,
            backgroundColor: 'white',
            padding: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: selectedCategory?.bg ?? '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name={selectedCategory?.icon ?? 'help-outline'}
                size={20}
                color={selectedCategory?.color ?? '#0A7CFF'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}
              >
                {(selectedCategory?.label ?? '').replace('\n', ' ')}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: '#64748B',
                  marginTop: 2,
                }}
              >
                {selectedCategory?.sublabel}
              </Text>
            </View>
          </View>

          <Text
            style={{
              marginTop: 12,
              fontSize: 13,
              color: '#475569',
              lineHeight: 20,
            }}
          >
            Chuyên viên hỗ trợ sẽ tư vấn theo danh mục bạn vừa chọn. Bạn có thể
            bắt đầu chat ngay hoặc gọi tổng đài để được xử lý nhanh hơn.
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setSelectedCategoryIndex(null);
                handleChat();
              }}
              activeOpacity={0.85}
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                backgroundColor: '#0A7CFF',
              }}
            >
              <MaterialIcons name="chat-bubble" size={16} color="white" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
                Trao đổi qua chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSelectedCategoryIndex(null);
                handleCall();
              }}
              activeOpacity={0.85}
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <MaterialIcons name="phone" size={16} color="#334155" />
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}
              >
                Gọi tổng đài 1900-2805
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedCategoryIndex(null)}
              activeOpacity={0.8}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: '#64748B' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default SupportScreen;
