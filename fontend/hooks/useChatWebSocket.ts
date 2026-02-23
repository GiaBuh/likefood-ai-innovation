import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { createChatWebSocketClient, ChatMessageRes } from '../services/chatWebSocket';

/**
 * Subscribes to real-time chat messages for a user via WebSocket.
 * Only connects when userId and token are available.
 */
export function useChatWebSocket(
  userId: string | null,
  onMessage: (msg: ChatMessageRes) => void
) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!userId) return;
    try {
      const client = createChatWebSocketClient(userId, (msg) => onMessageRef.current(msg));
      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.warn('[useChatWebSocket] Failed to connect:', err);
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      disconnect();
      return;
    }
    connect();
    return () => disconnect();
  }, [userId, connect, disconnect]);

  return { connect, disconnect };
}
