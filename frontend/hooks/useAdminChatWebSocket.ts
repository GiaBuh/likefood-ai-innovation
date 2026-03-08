import { useEffect, useRef, useCallback } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import { createAdminChatWebSocketClient, ChatMessageRes, TOPIC_PREFIX } from '../services/chatWebSocket';

/**
 * Admin-specific WebSocket hook that subscribes to ALL user conversation topics
 * simultaneously. When the set of userIds changes, it dynamically subscribes/
 * unsubscribes without tearing down the STOMP connection.
 */
export function useAdminChatWebSocket(
  userIds: string[],
  onMessage: (userId: string, msg: ChatMessageRes) => void
) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const onMessageRef = useRef(onMessage);
  const connectedRef = useRef(false);
  onMessageRef.current = onMessage;

  // Synchronise subscriptions with the current set of userIds
  const syncSubscriptions = useCallback((client: Client, ids: string[]) => {
    const current = subscriptionsRef.current;
    const desired = new Set(ids);

    // Unsubscribe from topics no longer needed
    for (const [uid, sub] of current.entries()) {
      if (!desired.has(uid)) {
        try { sub.unsubscribe(); } catch { /* ignore */ }
        current.delete(uid);
      }
    }

    // Subscribe to new topics
    for (const uid of desired) {
      if (!current.has(uid)) {
        const topic = TOPIC_PREFIX + uid;
        const sub = client.subscribe(topic, (message) => {
          try {
            const payload = JSON.parse(message.body) as ChatMessageRes;
            onMessageRef.current(uid, payload);
          } catch {
            // ignore invalid payload
          }
        });
        current.set(uid, sub);
      }
    }
  }, []);

  // Store latest userIds so reconnect can re-subscribe
  const userIdsRef = useRef(userIds);
  userIdsRef.current = userIds;

  // Connect once, re-subscribe on reconnect
  useEffect(() => {
    if (userIds.length === 0) return;

    try {
      const client = createAdminChatWebSocketClient((activeClient) => {
        connectedRef.current = true;
        syncSubscriptions(activeClient, userIdsRef.current);
      });
      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.warn('[useAdminChatWebSocket] Failed to connect:', err);
    }

    return () => {
      connectedRef.current = false;
      subscriptionsRef.current.clear();
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  // Only reconnect when going from 0→N or N→0 userIds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.length > 0, syncSubscriptions]);

  // Re-sync subscriptions when userIds change (while already connected)
  useEffect(() => {
    if (connectedRef.current && clientRef.current?.connected) {
      syncSubscriptions(clientRef.current, userIds);
    }
  }, [userIds, syncSubscriptions]);
}
