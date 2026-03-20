import 'react-native-get-random-values';

import { MaterialIcons } from '@expo/vector-icons';
import Daily, {
  DailyCall,
  DailyEventObjectAccessState,
  DailyMediaView,
  DailyParticipantsObject,
} from '@daily-co/react-native-daily-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  useJoinVideoCall,
  useLeaveVideoCall,
  useVideoCallStatus,
} from '@/hooks/useAppointments';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────
type AccessState = 'idle' | 'lobby' | 'granted' | 'denied';

const PRIMARY = '#0A7CFF';

// ─── Debug logger ─────────────────────────────────────────────────────────────
const DEBUG = __DEV__;

function log(tag: string, message: string, data?: unknown) {
  if (!DEBUG) return;
  const time = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    console.log(`[VideoCall][${time}] ${tag} — ${message}`, data);
  } else {
    console.log(`[VideoCall][${time}] ${tag} — ${message}`);
  }
}

function logError(tag: string, message: string, error?: unknown) {
  if (!DEBUG) return;
  const time = new Date().toISOString().slice(11, 23);
  console.error(`[VideoCall][${time}] ❌ ${tag} — ${message}`, error ?? '');
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function DetailLine({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-[11px] ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <Text className="text-[13px] text-slate-400">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-sm font-semibold text-slate-900">
        {value}
      </Text>
    </View>
  );
}

function StateCard({
  icon,
  title,
  description,
  children,
  accentColor = PRIMARY,
  accentBg = '#EFF6FF',
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  children?: ReactNode;
  accentColor?: string;
  accentBg?: string;
}) {
  return (
    <View className="rounded-[20px] bg-white p-5 shadow-sm">
      <View
        className="mb-4 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: accentBg }}
      >
        <MaterialIcons name={icon} size={28} color={accentColor} />
      </View>

      <Text className="text-[18px] font-bold text-slate-900">{title}</Text>
      <Text className="mt-1.5 text-[13px] leading-5 text-slate-500">
        {description}
      </Text>

      {children ? <View className="mt-5">{children}</View> : null}
    </View>
  );
}

export function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const resolvedAppointmentId = appointmentId ?? '';

  // ── Auth ──────────────────────────────────────────────────────────────────
  const currentUser = useAuthStore((s) => s.user);
  const fullName = currentUser?.fullName ?? '';

  const fullNameRef = useRef(fullName);
  useEffect(() => {
    fullNameRef.current = fullName;
  }, [fullName]);

  log('Init', 'component mounted', { appointmentId: resolvedAppointmentId });

  const videoStatusQuery = useVideoCallStatus(resolvedAppointmentId);
  const joinMutation = useJoinVideoCall();
  const leaveMutation = useLeaveVideoCall();

  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<DailyParticipantsObject>(
    {} as DailyParticipantsObject,
  );
  const [isJoined, setIsJoined] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [accessState, setAccessState] = useState<AccessState>('idle');

  const bottomBarStyle = {
    paddingBottom: Math.max(insets.bottom, 16),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 8,
    elevation: 16,
  } as const;

  // ── Daily setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    let pendingRequestAccess = false;

    log('Daily', 'creating call object');
    const newCallObject = Daily.createCallObject();
    setCallObject(newCallObject);
    log('Daily', 'call object created');

    const handleEvent = () => {
      const current = newCallObject.participants();
      log('Daily', 'participants updated', {
        count: Object.keys(current).length,
        local: {
          audio: current.local?.audio,
          video: current.local?.video,
          hasVideoTrack: !!current.local?.videoTrack,
          hasAudioTrack: !!current.local?.audioTrack,
        },
        remotes: Object.values(current)
          .filter((p) => !p.local)
          .map((p) => ({
            id: p.session_id,
            audio: p.audio,
            video: p.video,
            hasVideoTrack: !!p.videoTrack,
            hasAudioTrack: !!p.audioTrack,
          })),
      });
      setParticipants({ ...current });
    };

    newCallObject.on('participant-joined', (e) => {
      log('Daily', 'participant-joined', e);
      handleEvent();
    });

    newCallObject.on('participant-updated', (e) => {
      log('Daily', 'participant-updated', e);
      handleEvent();
    });

    newCallObject.on('participant-left', (e) => {
      log('Daily', 'participant-left', e);
      handleEvent();
    });

    newCallObject.on('joined-meeting', (e) => {
      log('Daily', '✅ joined-meeting', e);
      if (pendingRequestAccess) {
        log(
          'Daily',
          '🔔 auto-calling requestAccess() after join (lobby was pending)',
        );
        pendingRequestAccess = false;

        void newCallObject
          .requestAccess({
            access: { level: 'full' },
            name: fullNameRef.current,
          })
          .then((r) => log('Daily', 'requestAccess auto result', r))
          .catch((err) => logError('Daily', 'requestAccess auto failed', err));

        return;
      }

      setIsJoined(true);
      setAccessState('granted');
    });

    newCallObject.on('left-meeting', (e) => {
      log('Daily', 'left-meeting', e);
      setIsJoined(false);
      setAccessState('idle');
      setParticipants({} as DailyParticipantsObject);
    });

    newCallObject.on(
      'access-state-updated',
      (e: DailyEventObjectAccessState) => {
        log('Daily', 'access-state-updated', e);
        const { access } = e;

        if (access === 'unknown') {
          log('Daily', 'access unknown — waiting');
        } else if (access.level === 'lobby') {
          log('Daily', '🔒 room is private — waiting for host approval');
          const state = newCallObject.meetingState();
          log('Daily', 'meetingState at lobby', state);

          if (state === 'joined-meeting') {
            log('Daily', '🔔 joined already — calling requestAccess() now');
            void newCallObject
              .requestAccess({
                access: { level: 'full' },
                name: fullNameRef.current,
              })
              .then((r) => log('Daily', 'requestAccess result', r))
              .catch((err) => logError('Daily', 'requestAccess failed', err));
          } else {
            pendingRequestAccess = true;
          }

          setAccessState('lobby');
        } else if (access.level === 'full') {
          log('Daily', '✅ access granted by host');
          setIsJoined(true);
          setAccessState('granted');
        } else if (access.level === 'none') {
          logError('Daily', '🚫 access denied — level none');
          setAccessState('denied');
        }
      },
    );

    newCallObject.on('error', (e) => {
      logError('Daily', 'error event received', e);
    });

    newCallObject.on('camera-error', (e) => {
      logError('Daily', 'camera-error event', e);
    });

    return () => {
      log('Daily', 'cleanup — destroying call object');
      newCallObject.destroy();
    };
  }, []);

  // ── Log query state changes ───────────────────────────────────────────────
  useEffect(() => {
    log('Query', 'videoStatusQuery state changed', {
      isLoading: videoStatusQuery.isLoading,
      isError: videoStatusQuery.isError,
      data: videoStatusQuery.data,
      error: videoStatusQuery.error,
    });
  }, [
    videoStatusQuery.isLoading,
    videoStatusQuery.isError,
    videoStatusQuery.data,
    videoStatusQuery.error,
  ]);

  const localParticipant = participants.local;
  const remoteParticipant = useMemo(
    () => Object.values(participants).find((p) => !p.local),
    [participants],
  );

  const handleJoin = async () => {
    log('handleJoin', 'called', {
      callObject: !!callObject,
      resolvedAppointmentId,
    });

    if (!callObject || !resolvedAppointmentId) {
      logError('handleJoin', 'missing callObject or appointmentId — aborting');
      return;
    }

    if (isJoiningRoom || joinMutation.isPending) {
      log('handleJoin', 'already joining — skipping');
      return;
    }

    try {
      setIsJoiningRoom(true);
      log('handleJoin', 'calling joinMutation.mutateAsync', {
        resolvedAppointmentId,
      });

      const payload = await joinMutation.mutateAsync(resolvedAppointmentId);

      log('handleJoin', 'got payload from API', {
        url: payload.url,
        hasToken: !!payload.token,
      });

      log('handleJoin', 'calling callObject.join');
      await callObject.join({
        url: payload.url,
        ...(payload.token ? { token: payload.token } : {}),
        videoSource: false,
        audioSource: false,
      });

      log(
        'handleJoin',
        'callObject.join resolved — waiting for joined-meeting or access-state-updated',
      );
    } catch (e) {
      logError('handleJoin', 'error during join', e);
      setAccessState('idle');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Guard: chỉ gọi leave API đúng 1 lần dù handleLeave + unmount cùng fire
  const hasCalledLeaveApiRef = useRef(false);

  const callLeaveApiBestEffort = useCallback(async () => {
    if (!resolvedAppointmentId) return;

    if (!isJoined) {
      log('callLeaveApiBestEffort', 'skip — never joined');
      return;
    }

    if (hasCalledLeaveApiRef.current) {
      log('callLeaveApiBestEffort', 'already called — skipping duplicate');
      return;
    }

    hasCalledLeaveApiRef.current = true;
    log('callLeaveApiBestEffort', 'calling leave API', {
      resolvedAppointmentId,
    });

    try {
      await leaveMutation.mutateAsync(resolvedAppointmentId);
      log('callLeaveApiBestEffort', 'leave API success');
    } catch (e) {
      logError('callLeaveApiBestEffort', 'leave API failed (best-effort)', e);
    }
  }, [leaveMutation, resolvedAppointmentId]);

  const handleLeave = useCallback(async () => {
    log('handleLeave', 'called', { callObject: !!callObject, isLeavingRoom });

    if (!callObject || isLeavingRoom) return;

    try {
      setIsLeavingRoom(true);
      log('handleLeave', 'calling callObject.leave()');
      await callObject.leave();
      log('handleLeave', 'callObject.leave() resolved');
      await callLeaveApiBestEffort();
    } finally {
      setIsLeavingRoom(false);
      setAccessState('idle');
      log('handleLeave', 'navigating back');
      router.back();
    }
  }, [callLeaveApiBestEffort, callObject, isLeavingRoom, router]);

  const handleRequestAccess = useCallback(async () => {
    if (!callObject) return;

    log('handleRequestAccess', 'calling requestAccess()');

    try {
      const result = await callObject.requestAccess({
        access: { level: 'full' },
        name: fullNameRef.current,
      });
      log('handleRequestAccess', 'requestAccess result', result);
    } catch (e) {
      logError('handleRequestAccess', 'failed', e);
    }
  }, [callObject]);

  const handleCancelLobby = useCallback(async () => {
    log('handleCancelLobby', 'user cancelled lobby request');
    if (!callObject) return;

    try {
      await callObject.leave();
    } catch {}

    setAccessState('idle');
  }, [callObject]);

  const callLeaveApiBestEffortRef = useRef(callLeaveApiBestEffort);

  useEffect(() => {
    callLeaveApiBestEffortRef.current = callLeaveApiBestEffort;
  }, [callLeaveApiBestEffort]);

  useEffect(() => {
    return () => {
      log('Unmount', 'component unmounting — calling leave API best-effort');
      void callLeaveApiBestEffortRef.current();
    };
  }, []);

  const toggleMic = () => {
    const next = !localParticipant?.audio;
    log('toggleMic', `audio → ${next}`);
    callObject?.setLocalAudio(next);
  };

  const toggleCam = () => {
    const next = !localParticipant?.video;
    log('toggleCam', `video → ${next}`);
    callObject?.setLocalVideo(next);
  };

  const flipCamera = async () => {
    log('flipCamera', 'called');

    try {
      await callObject?.cycleCamera();
      setIsFrontCamera((prev) => {
        log('flipCamera', `isFrontCamera → ${!prev}`);
        return !prev;
      });
    } catch (e) {
      logError('flipCamera', 'failed', e);
    }
  };

  // ── Guard screens ─────────────────────────────────────────────────────────
  if (!resolvedAppointmentId) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Video call" />
        <View className="flex-1 p-4">
          <StateCard
            icon="error-outline"
            title="Thiếu mã lịch hẹn"
            description="Không thể mở màn video call vì thiếu appointmentId."
            accentColor="#ef4444"
            accentBg="#FEF2F2"
          />
        </View>
      </View>
    );
  }

  if (videoStatusQuery.isLoading) {
    return <Loading label="Đang kiểm tra trạng thái video call..." />;
  }

  if (videoStatusQuery.isError) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Video call" />

        <View className="flex-1 p-4">
          <StateCard
            icon="wifi-off"
            title="Không thể tải trạng thái cuộc gọi"
            description="Vui lòng thử lại sau."
            accentColor="#ef4444"
            accentBg="#FEF2F2"
          />
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
          style={bottomBarStyle}
        >
          <TouchableOpacity
            onPress={() => void videoStatusQuery.refetch()}
            activeOpacity={0.85}
            className="items-center justify-center rounded-[14px] bg-blue-500 py-[15px]"
          >
            <Text className="text-[15px] font-bold text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!videoStatusQuery.data?.canJoin && !isJoined) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Video call" />

        <View className="flex-1 p-4">
          <StateCard
            icon="schedule"
            title="Chưa thể tham gia"
            description={
              videoStatusQuery.data?.message ||
              'Bạn chưa thể tham gia video call lúc này.'
            }
            accentColor="#f59e0b"
            accentBg="#FFF7ED"
          >
            <View className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-1">
              <DetailLine label="Mã lịch hẹn" value={resolvedAppointmentId} isLast />
            </View>
          </StateCard>
        </View>
      </View>
    );
  }

  if (accessState === 'denied') {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Video call" />

        <View className="flex-1 p-4">
          <StateCard
            icon="block"
            title="Yêu cầu bị từ chối"
            description="Host đã không cho phép bạn tham gia cuộc gọi này."
            accentColor="#ef4444"
            accentBg="#FEF2F2"
          />
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
          style={bottomBarStyle}
        >
          <TouchableOpacity
            onPress={() => setAccessState('idle')}
            activeOpacity={0.85}
            className="mb-2 items-center justify-center rounded-[14px] bg-blue-500 py-[15px]"
          >
            <Text className="text-[15px] font-bold text-white">Thử lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            className="items-center justify-center rounded-[14px] border border-slate-200 py-[14px]"
          >
            <Text className="text-[15px] font-bold text-slate-700">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (accessState === 'lobby') {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Video call" />

        <View className="flex-1 p-4">
          <StateCard
            icon="lock-clock"
            title="Đang chờ host duyệt"
            description="Yêu cầu tham gia đã được gửi. Vui lòng chờ host chấp nhận để vào cuộc gọi."
            accentColor="#0A7CFF"
            accentBg="#EFF6FF"
          >
            <View className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-1">
              <DetailLine label="Mã lịch hẹn" value={resolvedAppointmentId} isLast />
            </View>
          </StateCard>
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
          style={bottomBarStyle}
        >
          <TouchableOpacity
            onPress={() => void handleRequestAccess()}
            activeOpacity={0.85}
            className="mb-2 items-center justify-center rounded-[14px] bg-blue-500 py-[15px]"
          >
            <Text className="text-[15px] font-bold text-white">Gửi lại yêu cầu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => void handleCancelLobby()}
            activeOpacity={0.85}
            className="items-center justify-center rounded-[14px] border border-slate-200 py-[14px]"
          >
            <Text className="text-[15px] font-bold text-slate-700">Huỷ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isJoined) {
    log('Render', isJoiningRoom ? 'joining state card' : 'pre-join screen');

    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Video call" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <StateCard
            icon="video-call"
            title={
              isJoiningRoom
                ? 'Đang chuẩn bị cuộc gọi'
                : 'Sẵn sàng tham gia video call'
            }
            description={
              isJoiningRoom
                ? 'Hệ thống đang kết nối phòng họp và kiểm tra quyền truy cập.'
                : 'Bạn có thể tham gia cuộc gọi với bác sĩ khi đã sẵn sàng.'
            }
          >
            <View className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-1">
              <DetailLine label="Mã lịch hẹn" value={resolvedAppointmentId} />
              <DetailLine
                label="Trạng thái"
                value={
                  isJoiningRoom
                    ? 'Đang kết nối...'
                    : videoStatusQuery.data?.message || 'Có thể tham gia'
                }
                isLast
              />
            </View>
          </StateCard>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
          style={bottomBarStyle}
        >
          <TouchableOpacity
            onPress={handleJoin}
            disabled={isJoiningRoom}
            activeOpacity={0.85}
            className={`flex-row items-center justify-center rounded-[14px] py-[15px] ${
              isJoiningRoom ? 'bg-blue-300' : 'bg-blue-500'
            }`}
          >
            {isJoiningRoom ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons
                  name="video-call"
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-[15px] font-bold text-white">
                  Vào video call
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── In-call screen ────────────────────────────────────────────────────────
  log('Render', 'in-call screen', {
    hasRemoteVideo: !!remoteParticipant?.videoTrack,
    hasLocalVideo: !!localParticipant?.videoTrack,
    isFrontCamera,
  });

  return (
    <View style={styles.container}>
      {/* Remote video / placeholder */}
      {remoteParticipant ? (
        remoteParticipant.videoTrack ? (
          <DailyMediaView
            videoTrack={remoteParticipant.videoTrack}
            audioTrack={remoteParticipant.audioTrack || null}
            style={StyleSheet.absoluteFillObject}
            objectFit="cover"
          />
        ) : (
          <>
            {remoteParticipant.audioTrack && (
              <DailyMediaView
                videoTrack={null}
                audioTrack={remoteParticipant.audioTrack}
                style={{ width: 0, height: 0, position: 'absolute' }}
              />
            )}

            <View style={styles.remotePlaceholder}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {remoteParticipant.user_name
                    ? remoteParticipant.user_name.charAt(0).toUpperCase()
                    : '?'}
                </Text>
              </View>

              <Text style={styles.remoteNameText}>
                {remoteParticipant.user_name || 'Người tham gia'}
              </Text>

              <View style={styles.camOffBadge}>
                <MaterialIcons
                  name="videocam-off"
                  size={13}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.camOffText}>Đã tắt camera</Text>
              </View>
            </View>
          </>
        )
      ) : (
        <View style={styles.remotePlaceholder}>
          <ActivityIndicator
            color="rgba(255,255,255,0.5)"
            size="small"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.waitingText}>Đang chờ người khác tham gia…</Text>
        </View>
      )}

      {/* Top info card */}
      <View
        className="absolute left-4 right-4 rounded-[18px] border border-white/70 bg-white/92 px-4 py-3"
        style={{ top: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-[15px] font-bold text-slate-900">
              {remoteParticipant?.user_name || 'Video consultation'}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {remoteParticipant
                ? 'Cuộc gọi đang diễn ra'
                : 'Đang chờ người tham gia còn lại'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => void handleLeave()}
            activeOpacity={0.8}
            className="rounded-full bg-slate-100 p-2.5"
          >
            <MaterialIcons name="close" size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Local PiP */}
      {localParticipant?.videoTrack ? (
        <View style={[styles.localVideoContainer, { top: insets.top + 76 }]}>
          <DailyMediaView
            videoTrack={localParticipant.videoTrack}
            audioTrack={null}
            mirror={isFrontCamera}
            style={styles.localVideo}
            objectFit="cover"
          />
        </View>
      ) : null}

      {/* Bottom action bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
        style={bottomBarStyle}
      >
        <View className="mb-3 flex-row items-center justify-center">
          <TouchableOpacity
            onPress={toggleCam}
            activeOpacity={0.85}
            className={`mr-3 h-[52px] w-[52px] items-center justify-center rounded-full ${
              localParticipant?.video ? 'bg-blue-50' : 'bg-slate-200'
            }`}
          >
            <MaterialIcons
              name={localParticipant?.video ? 'videocam' : 'videocam-off'}
              size={22}
              color={localParticipant?.video ? '#0A7CFF' : '#64748B'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => void flipCamera()}
            activeOpacity={0.85}
            className="mr-3 h-[52px] w-[52px] items-center justify-center rounded-full bg-blue-50"
          >
            <MaterialIcons name="flip-camera-ios" size={22} color="#0A7CFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMic}
            activeOpacity={0.85}
            className={`h-[52px] w-[52px] items-center justify-center rounded-full ${
              localParticipant?.audio ? 'bg-blue-50' : 'bg-slate-200'
            }`}
          >
            <MaterialIcons
              name={localParticipant?.audio ? 'mic' : 'mic-off'}
              size={22}
              color={localParticipant?.audio ? '#0A7CFF' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => void handleLeave()}
          activeOpacity={0.85}
          className="items-center justify-center rounded-[14px] bg-red-500 py-[15px]"
        >
          <Text className="text-[15px] font-bold text-white">
            Kết thúc cuộc gọi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  remotePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
  },
  waitingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3A6EA5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  remoteNameText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  camOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  camOffText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  localVideoContainer: {
    position: 'absolute',
    right: 16,
    width: 112,
    height: 156,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  localVideo: {
    flex: 1,
  },
});

export default VideoCallScreen;