import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";

export const useWebSocket = (topic) => {
  const [messages, setMessages] = useState([]);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!topic) return;

    const client = new Client({
      webSocketFactory: () => new WebSocket("ws://192.168.1.7:8080/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP DEBUG]', str),
      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        client.subscribe(topic, (message) => {
          if (message.body) {
            const payload = JSON.parse(message.body);
            console.log('📩 Message received:', payload);
            setMessages((prev) => [payload, ...prev]);
          }
        });
      },
      onStompError: (frame) => console.error('❌ STOMP Error', frame),
      onWebSocketError: (error) => console.error('❌ WebSocket Error', error),
      onWebSocketClose: (evt) => {
        console.error('❌ WebSocket closed:', evt.code, evt.reason);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        clientRef.current.deactivate();
      }
    };
  }, [topic]);

  const sendMessage = (destination, body) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  };

  return { messages, sendMessage };
};