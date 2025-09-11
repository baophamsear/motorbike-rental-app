import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';

export const useWebSocket = (topic) => {
  const [messages, setMessages] = useState([]);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!topic) return;

    const client = new Client({
      webSocketFactory: () => new WebSocket('http://localhost:8080/ws'), // Sử dụng ws:// hoặc wss://
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP DEBUG]', str),
      onConnect: () => {
        console.log('✅ Đã kết nối với WebSocket');
        client.subscribe(topic, (message) => {
          if (message.body) {
            const payload = JSON.parse(message.body);
            console.log('📩 Nhận được tin nhắn:', payload);
            setMessages((prev) => [payload, ...prev]);
          }
        });
      },
      onStompError: (frame) => console.error('❌ Lỗi STOMP:', frame),
      onWebSocketError: (error) => console.error('❌ Lỗi WebSocket:', error),
      onWebSocketClose: (evt) => {
        console.error('❌ WebSocket đã đóng:', evt.code, evt.reason);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        console.log('🧹 Đóng kết nối WebSocket');
        clientRef.current.deactivate();
      }
    };
  }, [topic]);

  const sendMessage = (destination, body) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    } else {
      console.warn('Không thể gửi tin nhắn: WebSocket chưa kết nối');
    }
  };

  return { messages, sendMessage };
};