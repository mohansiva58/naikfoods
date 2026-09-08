import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

const parseOrigins = (...values: Array<string | undefined>): string[] =>
    values
        .flatMap((value) => value?.split(',') || [])
        .map((origin) => origin.trim())
        .filter(Boolean);

export const initIO = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://localhost:8080",
                "https://leena-mu.vercel.app",
                "https://www.leenabyalekhya.in",
                ...parseOrigins(process.env.FRONTEND_URL, process.env.CORS_ORIGIN),
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => io;
