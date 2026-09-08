import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
    }

    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
    }

    return import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });
        }

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket?.off('connect', onConnect);
            socket?.off('disconnect', onDisconnect);
        };
    }, []);

    return { socket, isConnected };
};
