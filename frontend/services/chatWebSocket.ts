import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBaseUrl, getAccessToken } from './apiClient';

export type ChatMessageRes = { id: string; content: string; sender: string; createdAt: string };

type OnMessageCallback = (msg: ChatMessageRes) => void;

const WS_PATH = '/ws/chat';
const TOPIC_PREFIX = '/topic/chat/';

function getWsUrl(): string {
  const base = getApiBaseUrl();
  const url = new URL(base);
  const protocol = url.protocol === 'https:' ? 'https:' : 'http:';
  const host = url.host;
  return `${protocol}//${host}${WS_PATH}`;
}

export function createChatWebSocketClient(
  userId: string,
  onMessage: OnMessageCallback
): Client {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');

  const client = new Client({
    webSocketFactory: () => new SockJS(getWsUrl()) as any,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Auth-Token': token,
    },
    onConnect: (frame) => {
      const topic = TOPIC_PREFIX + userId;
      client.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body) as ChatMessageRes;
          onMessage(payload);
        } catch {
          // ignore invalid payload
        }
      });
    },
    onStompError: (frame) => {
      console.warn('[Chat WS] STOMP error:', frame.headers?.message ?? frame);
    },
  });

  return client;
}
