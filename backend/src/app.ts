import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';
import dishRoutes from './routes/dish.routes';
import authRoutes from './routes/auth.routes';
import commentRoutes from './routes/comment.routes';
import uploadRoutes from './routes/upload.routes';
import { requestId } from './middleware/request-id.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { sendSuccess } from './utils/api-response';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(requestId);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dishes', dishRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1', commentRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  return sendSuccess(res, { message: 'Welcome to Top Chef API' });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  return sendSuccess(res, { status: 'OK' });
});

app.use(errorMiddleware);

export default app;
