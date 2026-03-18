import 'react-native-get-random-values';

import { MaterialIcons } from '@expo/vector-icons';
import Daily, {
  DailyCall,
  DailyMediaView,
  DailyParticipantsObject,
  DailyEventObjectAccessState,
} from '@daily-co/react-native-daily-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import {
  useJoinVideoCall,
  useLeaveVideoCall,
  useVideoCallStatus,
} from '@/hooks/useAppointments';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────
type AccessState = 'idle' | 'lobby' | 'granted' | 'denied';

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

// ─── Joining overlay ──────────────────────────────────────────────────────────
function JoiningOverlay() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={overlay.container}>
      <Animated.View
        style={[overlay.ring, { transform: [{ scale: pulse }] }]}
      />
      <Animated.View style={[overlay.spinner, { transform: [{ rotate }] }]}>
        <View style={overlay.arc} />
      </Animated.View>
      <View style={overlay.iconWrap}>
        <MaterialIcons name="videocam" size={32} color="#fff" />
      </View>
      <Text style={overlay.title}>Đang tham gia cuộc gọi…</Text>
      <Text style={overlay.subtitle}>Vui lòng chờ trong giây lát</Text>
    </View>
  );
}

// ─── Lobby waiting overlay ────────────────────────────────────────────────────
function LobbyOverlay({
  onRequestAccess,
  onCancel,
}: {
  onRequestAccess: () => Promise<void>;
  onCancel: () => void;
}) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const [requested, setRequested] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const makePulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    makePulse(dot1, 0).start();
    makePulse(dot2, 200).start();
    makePulse(dot3, 400).start();
  }, [dot1, dot2, dot3]);

  const handleRetry = async () => {
    setRequesting(true);
    setRequested(false);
    try {
      await onRequestAccess();
      setRequested(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={lobby.container}>
      <View style={lobby.iconWrap}>
        <MaterialIcons name="lock-clock" size={36} color="#fff" />
      </View>

      <Text style={lobby.title}>Đang chờ host duyệt</Text>
      <Text style={lobby.subtitle}>
        {requested
          ? 'Yêu cầu tham gia đã được gửi.\nVui lòng chờ host chấp nhận.'
          : requesting
            ? 'Đang gửi yêu cầu...'
            : 'Nhấn bên dưới để gửi yêu cầu.'}
      </Text>

      {requested && (
        <View style={lobby.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[lobby.dot, { opacity: dot }]} />
          ))}
        </View>
      )}

      {!requested && (
        <TouchableOpacity
          style={[lobby.requestBtn, requesting && lobby.requestBtnDisabled]}
          onPress={() => void handleRetry()}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={lobby.requestBtnText}>Gửi yêu cầu tham gia</Text>
          )}
        </TouchableOpacity>
      )}

      {requested && (
        <TouchableOpacity
          style={lobby.resendBtn}
          onPress={() => void handleRetry()}
          disabled={requesting}
        >
          <Text style={lobby.resendText}>Gửi lại yêu cầu</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={lobby.cancelBtn} onPress={onCancel}>
        <Text style={lobby.cancelText}>Huỷ</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function VideoCallScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const resolvedAppointmentId = appointmentId ?? '';

  // ── Auth ──────────────────────────────────────────────────────────────────
  const currentUser = useAuthStore((s) => s.user);
  const fullName = currentUser?.fullName ?? '';
  // Dùng ref để các closure trong useEffect Daily luôn đọc được giá trị mới nhất
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

  // ── Log videoStatusQuery state changes ────────────────────────────────────
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
        videoSource: true,
        audioSource: true,
      });
      log(
        'handleJoin',
        'callObject.join resolved — waiting for joined-meeting or access-state-updated',
      );
    } catch (e) {
      logError('handleJoin', 'error during join', e);
      Alert.alert(
        'Chưa thể tham gia',
        'Vui lòng đợi trong giây lát.',
      );
      setAccessState('idle');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Guard: chỉ gọi leave API đúng 1 lần dù handleLeave + unmount cùng fire
  const hasCalledLeaveApiRef = useRef(false);

  const callLeaveApiBestEffort = useCallback(async () => {
    if (!resolvedAppointmentId) return;
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
  }, [leaveMutation.mutateAsync, resolvedAppointmentId]);

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
        name: fullName,
      });
      log('handleRequestAccess', 'requestAccess result', result);
    } catch (e) {
      logError('handleRequestAccess', 'failed', e);
    }
  }, [callObject, fullName]);

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
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Thiếu mã lịch hẹn"
          description="Không thể mở màn video call vì thiếu appointmentId."
        />
      </View>
    );
  }

  if (videoStatusQuery.isLoading) {
    return <Loading label="Đang kiểm tra trạng thái video call..." />;
  }

  if (videoStatusQuery.isError) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center gap-3 bg-blue-500 px-4 pb-4 pt-12">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="rounded-full p-1"
          >
            <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Video call</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            title="Không thể tải trạng thái cuộc gọi"
            description="Vui lòng thử lại sau."
          />
          <TouchableOpacity
            onPress={() => void videoStatusQuery.refetch()}
            className="mt-4 rounded-xl bg-blue-500 px-4 py-2.5"
          >
            <Text className="font-semibold text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!videoStatusQuery.data?.canJoin && !isJoined) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center gap-3 bg-blue-500 px-4 pb-4 pt-12">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="rounded-full p-1"
          >
            <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Video call</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            title="Chưa thể tham gia"
            description={
              videoStatusQuery.data?.message ||
              'Bạn chưa thể tham gia video call lúc này.'
            }
          />
        </View>
      </View>
    );
  }

  // ── Bị từ chối ────────────────────────────────────────────────────────────
  if (accessState === 'denied') {
    return (
      <View style={styles.startScreen}>
        <MaterialIcons
          name="block"
          size={48}
          color="#FF3B30"
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.deniedTitle}>Yêu cầu bị từ chối</Text>
        <Text style={styles.deniedSubtitle}>
          Host đã không cho phép bạn tham gia.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setAccessState('idle');
          }}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Đang chờ ở lobby ──────────────────────────────────────────────────────
  if (accessState === 'lobby') {
    return (
      <View style={styles.startScreen}>
        <LobbyOverlay
          onRequestAccess={handleRequestAccess}
          onCancel={() => void handleCancelLobby()}
        />
      </View>
    );
  }

  // ── Pre-join / joining screen ─────────────────────────────────────────────
  if (!isJoined) {
    log('Render', isJoiningRoom ? 'joining overlay' : 'pre-join screen');
    return (
      <View style={styles.startScreen}>
        {isJoiningRoom ? (
          <JoiningOverlay />
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoin}
            disabled={isJoiningRoom}
          >
            <MaterialIcons
              name="videocam"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.joinButtonText}>BẮT ĐẦU CUỘC GỌI</Text>
          </TouchableOpacity>
        )}
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
      {/* ── Remote video / placeholder ── */}
      {remoteParticipant ? (
        remoteParticipant.videoTrack ? (
          // Có video → hiển thị full screen
          <DailyMediaView
            videoTrack={remoteParticipant.videoTrack}
            audioTrack={remoteParticipant.audioTrack || null}
            style={StyleSheet.absoluteFillObject}
            objectFit="cover"
          />
        ) : (
          <>
            {/* Render audio ngay cả khi tắt cam */}
            {remoteParticipant.audioTrack && (
              <DailyMediaView
                videoTrack={null}
                audioTrack={remoteParticipant.audioTrack}
                style={{ width: 0, height: 0, position: 'absolute' }}
              />
            )}
            {/* Avatar placeholder kiểu Zoom */}
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
        // Chưa có ai tham gia
        <View style={styles.remotePlaceholder}>
          <ActivityIndicator
            color="rgba(255,255,255,0.5)"
            size="small"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.waitingText}>Đang chờ người khác tham gia…</Text>
        </View>
      )}

      {/* ── Local video (picture-in-picture) ── */}
      <View style={styles.localVideoContainer}>
        {localParticipant?.videoTrack ? (
          <DailyMediaView
            videoTrack={localParticipant.videoTrack}
            audioTrack={null}
            mirror={isFrontCamera}
            style={styles.localVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.localCamOffContainer}>
            <View style={styles.localAvatarCircle}>
              <Text style={styles.localAvatarInitial}>
                {fullName ? fullName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Controls ── */}
      <SafeAreaView style={styles.controlsWrapper}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              !localParticipant?.video && styles.offBtn,
            ]}
            onPress={toggleCam}
          >
            <MaterialIcons
              name={localParticipant?.video ? 'videocam' : 'videocam-off'}
              size={22}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={flipCamera}>
            <MaterialIcons name="flip-camera-ios" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              !localParticipant?.audio && styles.offBtn,
            ]}
            onPress={toggleMic}
          >
            <MaterialIcons
              name={localParticipant?.audio ? 'mic' : 'mic-off'}
              size={22}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endCallBtn}
            onPress={() => void handleLeave()}
          >
            <MaterialIcons name="call-end" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Lobby overlay styles ─────────────────────────────────────────────────────
const lobby = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  requestBtn: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 25,
    backgroundColor: '#34C759',
  },
  requestBtnDisabled: {
    opacity: 0.6,
  },
  requestBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  resendText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

// ─── Joining overlay styles ───────────────────────────────────────────────────
const SPINNER_SIZE = 90;

const overlay = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  ring: {
    position: 'absolute',
    width: SPINNER_SIZE + 40,
    height: SPINNER_SIZE + 40,
    borderRadius: (SPINNER_SIZE + 40) / 2,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  spinner: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arc: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 4,
    borderColor: '#34C759',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  iconWrap: {
    position: 'absolute',
    width: SPINNER_SIZE - 20,
    height: SPINNER_SIZE - 20,
    borderRadius: (SPINNER_SIZE - 20) / 2,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: SPINNER_SIZE / 2 + 24,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#34C759',
    borderRadius: 25,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deniedTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  deniedSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#34C759',
    borderRadius: 25,
    marginBottom: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  // ── Remote placeholder (chưa có ai) ──
  remotePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  waitingText: {
    color: 'white',
    fontSize: 16,
  },
  // ── Remote cam-off (avatar kiểu Zoom) ──
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
  // ── Local video (PiP) ──
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  localVideo: {
    flex: 1,
  },
  // ── Controls bar ──
  controlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    marginHorizontal: 24,
    marginBottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 40,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  offBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  endCallBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  localCamOffContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A6EA5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localAvatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default VideoCallScreen;