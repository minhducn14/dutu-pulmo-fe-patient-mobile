import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useHospitalCities } from '@/hooks/useHospitals';

export interface HospitalFilter {
  city: string;
  type: 'all' | 'hospital' | 'clinic';
}

interface HospitalFilterSheetProps {
  visible: boolean;
  current: HospitalFilter;
  onApply: (f: HospitalFilter) => void;
  onClose: () => void;
}

export function HospitalFilterSheet({
  visible,
  current,
  onApply,
  onClose,
}: HospitalFilterSheetProps) {
  const [draft, setDraft] = useState<HospitalFilter>(current);
  const citiesQuery = useHospitalCities();
  const onOpen = useCallback(() => setDraft(current), [current]);

  const typeOptions: { value: HospitalFilter['type']; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'hospital', label: 'Bệnh viện' },
    { value: 'clinic', label: 'Phòng khám' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={onOpen}
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32,
          maxHeight: '75%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: '#E2E8F0',
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: 20,
          }}
        >
          Bộ lọc
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12,
            }}
          >
            Loại cơ sở
          </Text>
          {typeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setDraft((d) => ({ ...d, type: opt.value }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F8FAFC',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: draft.type === opt.value ? '#0A7CFF' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {draft.type === opt.value && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#0A7CFF',
                    }}
                  />
                )}
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>{opt.label}</Text>
            </Pressable>
          ))}

          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#374151',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Tỉnh / Thành phố
          </Text>
          {[
            { value: '', label: 'Tất cả' },
            ...(citiesQuery.data ?? []).map((c) => ({ value: c, label: c })),
          ].map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setDraft((d) => ({ ...d, city: item.value }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F8FAFC',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: draft.city === item.value ? '#0A7CFF' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {draft.city === item.value && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#0A7CFF',
                    }}
                  />
                )}
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>{item.label}</Text>
            </Pressable>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          {/* Xoá bộ lọc */}
          <View style={{ flex: 1, marginRight: 6 }}>
            <View
              style={{
                height: 50,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Pressable
                onPress={() => setDraft({ city: '', type: 'all' })}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: 15,
                  }}
                >
                  Xoá bộ lọc
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Áp dụng */}
          <View style={{ flex: 1, marginLeft: 6 }}>
            <View
              style={{
                height: 50,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#2563EB',
                shadowColor: '#2563EB',
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Pressable
                onPress={() => {
                  onApply(draft);
                  onClose();
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  Áp dụng
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
