import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bookingRoutes from './routes/booking.routes';
import createDashboardRoutes from './routes/dashboard.routes';
import createServiceRoutes from './routes/services.routes';
import createAnalyticsRoutes from './routes/analytics.routes';
import createUserRoutes from './routes/users.routes';
import createAuthRoutes from './routes/auth.routes';
import { initializeGRPCClients, closeGRPCClients } from './grpc/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'intelli_reserve',
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'intelli-reserve-bff',
    grpc: 'connecting to :8090',
  });
});

// Routes
app.use('/api/auth', createAuthRoutes(pool));
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', createDashboardRoutes(pool));
app.use('/api/services', createServiceRoutes(pool));
app.use('/api/analytics', createAnalyticsRoutes(pool));
app.use('/api/users', createUserRoutes(pool));

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Initialize gRPC clients and start server
async function startServer() {
  try {
    // Initialize gRPC clients
    await initializeGRPCClients();
    console.log('✅ gRPC clients initialized');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 BFF running on http://localhost:${PORT}`);
      console.log(`📡 Connected to gRPC backend on :8090`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down BFF...');
      closeGRPCClients();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down BFF...');
      closeGRPCClients();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
