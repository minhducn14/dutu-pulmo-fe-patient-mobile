import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { chatSocketService } from '@/services/chat-socket.service';
import { useChatSocketStore } from '@/store/chat-socket.store';

export const SocketHandler: React.FC = () => {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const appState = useRef(AppState.currentState);
  
  const { 
    setConnected, 
    setOnlineUsers, 
    addOnlineUser, 
    removeOnlineUser 
  } = useChatSocketStore();

  useEffect(() => {
    if (!token || !user) {
      chatSocketService.disconnect();
      setConnected(false);
      return;
    }

    chatSocketService.connect(token);

    const onConnect = () => {
      setConnected(true);
      chatSocketService.requestOnlineUsers();
      chatSocketService.emitStatus('online');
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onOnlineUsers = (users: any[]) => {
      setOnlineUsers(users.map(u => u.id));
    };

    const onUserOnline = (payload: { userId: string }) => {
      addOnlineUser(payload.userId);
    };

    const onUserOffline = (payload: { userId: string }) => {
      removeOnlineUser(payload.userId);
    };

    const onNewMessage = (message: any) => {
      console.log('[SocketHandler] new message:', message);
    };

    chatSocketService.onConnect(onConnect);
    chatSocketService.onDisconnect(onDisconnect);
    chatSocketService.onOnlineUsers(onOnlineUsers);
    chatSocketService.onUserOnline(onUserOnline);
    chatSocketService.onUserOffline(onUserOffline);
    chatSocketService.onNewMessage(onNewMessage);

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      chatSocketService.offConnect(onConnect);
      chatSocketService.offDisconnect(onDisconnect);
      chatSocketService.offOnlineUsers(onOnlineUsers);
      chatSocketService.offUserOnline(onUserOnline);
      chatSocketService.offUserOffline(onUserOffline);
      chatSocketService.offNewMessage(onNewMessage);
      subscription.remove();
    };
  }, [token, user]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      if (token && user) {
        chatSocketService.connect(token);
      }
    } else if (nextAppState.match(/inactive|background/)) {
      chatSocketService.emitStatus('away');
      
      setTimeout(() => {
        if (AppState.currentState !== 'active') {
          chatSocketService.disconnect();
        }
      }, 60000);
    }

    appState.current = nextAppState;
  };

  return null;
};
