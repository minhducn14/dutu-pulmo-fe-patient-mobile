import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMyPatient, useUpdateMyPatient, useUpdateMyUser } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/auth.store';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import type { components } from '@/types/generated/patient-api';

type UpdateUserDto = components['schemas']['UpdateUserDto'];

type GenderValue = NonNullable<UpdateUserDto['gender']>;

export function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((state) => state.user);
  const myPatientQuery = useMyPatient();
  const updateMyUser = useUpdateMyUser();
  const updateMyPatient = useUpdateMyPatient();

  const patientUser = myPatientQuery.data?.user;
  const initialData = useMemo(
    () => ({
      fullName: patientUser?.fullName ?? authUser?.fullName ?? '',
      phone: patientUser?.phone ?? '',
      dateOfBirth: patientUser?.dateOfBirth ?? '',
      gender: (patientUser?.gender as GenderValue | undefined) ?? undefined,
      address: patientUser?.address ?? '',
      province: patientUser?.province ?? '',
      ward: patientUser?.ward ?? '',
      bloodType: myPatientQuery.data?.bloodType ?? '',
      emergencyContactName: myPatientQuery.data?.emergencyContactName ?? '',
      emergencyContactPhone: myPatientQuery.data?.emergencyContactPhone ?? '',
      emergencyContactRelationship: myPatientQuery.data?.emergencyContactRelationship ?? '',
      insuranceProvider: myPatientQuery.data?.insuranceProvider ?? '',
      insuranceNumber: myPatientQuery.data?.insuranceNumber ?? '',
      insuranceExpiry: myPatientQuery.data?.insuranceExpiry ?? '',
    }),
    [authUser?.fullName, patientUser, myPatientQuery.data],
  );

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<GenderValue | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');

  useEffect(() => {
    setFullName(initialData.fullName);
    setPhone(initialData.phone);
    setDateOfBirth(initialData.dateOfBirth);
    setGender(initialData.gender);
    setAddress(initialData.address);
    setProvince(initialData.province);
    setWard(initialData.ward);
    setBloodType(initialData.bloodType);
    setEmergencyContactName(initialData.emergencyContactName);
    setEmergencyContactPhone(initialData.emergencyContactPhone);
    setEmergencyContactRelationship(initialData.emergencyContactRelationship);
    setInsuranceProvider(initialData.insuranceProvider);
    setInsuranceNumber(initialData.insuranceNumber);
    setInsuranceExpiry(initialData.insuranceExpiry);
  }, [initialData]);

  const canSubmit =
    fullName.trim().length > 0 && !updateMyUser.isPending && !updateMyPatient.isPending;

  const onSave = () => {
    const payload: UpdateUserDto = {
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender,
      address: address.trim() || undefined,
      province: province.trim() || undefined,
      ward: ward.trim() || undefined,
    };

    updateMyUser.mutate(payload, {
      onSuccess: () => {
        if (myPatientQuery.data?.id) {
          updateMyPatient.mutate(
            {
              bloodType: bloodType.trim() || undefined,
              emergencyContactName: emergencyContactName.trim() || undefined,
              emergencyContactPhone: emergencyContactPhone.trim() || undefined,
              emergencyContactRelationship: emergencyContactRelationship.trim() || undefined,
              insuranceProvider: insuranceProvider.trim() || undefined,
              insuranceNumber: insuranceNumber.trim() || undefined,
              insuranceExpiry: insuranceExpiry.trim() || undefined,
            },
            {
              onSuccess: () => router.back(),
            },
          );
        } else {
          router.back();
        }
      },
    });
  };

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await myPatientQuery.refetch();
  });

  if (myPatientQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#0A7CFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View 
        className="flex-row items-center gap-3 bg-blue-500 px-4 pb-4 shadow-sm"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="rounded-full p-1"
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Cập nhật hồ sơ</Text>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="rounded-2xl bg-white p-4">
            <Text className="mb-2 text-xs font-semibold text-slate-500">Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
            />

            <Text className="mb-2 text-xs font-semibold text-slate-500">Số điện thoại</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Nhập số điện thoại"
              className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
            />

            <Text className="mb-2 text-xs font-semibold text-slate-500">Ngày sinh (YYYY-MM-DD)</Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="1990-01-15"
              className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
            />

            <Text className="mb-2 text-xs font-semibold text-slate-500">Giới tính</Text>
            <View className="mb-4 flex-row gap-2">
              {([
                { key: 'MALE', label: 'Nam' },
                { key: 'FEMALE', label: 'Nữ' },
                { key: 'OTHER', label: 'Khác' },
              ] as const).map((item) => {
                const selected = gender === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setGender(item.key)}
                    className={`rounded-xl px-3 py-2 ${selected ? 'bg-blue-500' : 'bg-slate-100'}`}
                  >
                    <Text className={selected ? 'text-white' : 'text-slate-700'}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="mb-2 text-xs font-semibold text-slate-500">Địa chỉ chi tiết</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ"
              className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
            />

            <Text className="mb-2 text-xs font-semibold text-slate-500">Tỉnh/Thành</Text>
            <TextInput
              value={province}
              onChangeText={setProvince}
              placeholder="Nhập tỉnh/thành"
              className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
            />

            <Text className="mb-2 text-xs font-semibold text-slate-500">Phường/Xã</Text>
            <TextInput
              value={ward}
              onChangeText={setWard}
              placeholder="Nhập phường/xã"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
            />

            <View className="mb-4 mt-2 border-t border-slate-100 pt-4">
              <Text className="mb-4 text-sm font-bold text-slate-900">Liên hệ khẩn cấp</Text>

              <Text className="mb-2 text-xs font-semibold text-slate-500">Họ và tên</Text>
              <TextInput
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Tên người liên hệ"
                className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
              />

              <Text className="mb-2 text-xs font-semibold text-slate-500">Số điện thoại</Text>
              <TextInput
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                keyboardType="phone-pad"
                placeholder="Số điện thoại"
                className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
              />

              <Text className="mb-2 text-xs font-semibold text-slate-500">Mối quan hệ</Text>
              <TextInput
                value={emergencyContactRelationship}
                onChangeText={setEmergencyContactRelationship}
                placeholder="VD: Bố, Mẹ, Vợ..."
                className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
              />
            </View>

            <View className="mb-4 border-t border-slate-100 pt-4">
              <Text className="mb-4 text-sm font-bold text-slate-900">Bảo hiểm & Y tế</Text>

              <Text className="mb-2 text-xs font-semibold text-slate-500">Nhà cung cấp bảo hiểm</Text>
              <TextInput
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
                placeholder="Nhà cung cấp"
                className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
              />

              <Text className="mb-2 text-xs font-semibold text-slate-500">Số bảo hiểm y tế</Text>
              <TextInput
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
                placeholder="Số bảo hiểm"
                className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
              />

              <Text className="mb-2 text-xs font-semibold text-slate-500">Ngày hết hạn (YYYY-MM-DD)</Text>
              <TextInput
                value={insuranceExpiry}
                onChangeText={setInsuranceExpiry}
                placeholder="2026-12-31"
                className="mb-4 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
              />

              <Text className="mb-2 text-xs font-semibold text-slate-500">Nhóm máu</Text>
              <View className="flex-row flex-wrap gap-2">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => {
                  const selected = bloodType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setBloodType(type)}
                      className={`rounded-xl px-3 py-2 ${selected ? 'bg-blue-500' : 'bg-slate-100'}`}
                    >
                      <Text className={selected ? 'text-white' : 'text-slate-700'}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
 
        <View 
          className="border-t border-slate-200 bg-white p-4"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TouchableOpacity
            onPress={onSave}
            disabled={!canSubmit}
            className={`items-center rounded-xl py-3 ${canSubmit ? 'bg-blue-500' : 'bg-blue-300'}`}
          >
            <Text className="font-semibold text-white">
              {updateMyUser.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default EditProfileScreen;
