import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const socket = io('', { path: '/api/socket.io' });

export function useSocket() {
  return socket;
}
