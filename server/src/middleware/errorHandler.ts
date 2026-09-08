import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('Error:', err);

    let statusCode = 500;
    let message = 'Internal server error';
    let stack: string | undefined;

    if (err instanceof Error) {
        message = err.message;
        stack = err.stack;
        if ('statusCode' in err) {
            statusCode = (err as { statusCode?: number }).statusCode || 500;
        }
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && stack && { stack }),
    });
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        error: `Route ${req.method} ${req.originalUrl} not found`,
    });
};
