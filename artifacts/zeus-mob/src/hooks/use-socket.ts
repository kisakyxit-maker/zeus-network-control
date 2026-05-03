import { io } from "socket.io-client";

const socket = io("", {
  path: "/api/socket.io",
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: true,
});

export function useSocket() {
  return socket;
}
