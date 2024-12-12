import { json } from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import { transitLinesRouter } from './api/transit-lines'

/**
 * Main Express application instance.
 * Configures middleware and routes for the transit lines API.
 */
export const app = express()

// Custom logging middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Morgan middleware for HTTP request logging in development mode
app.use(morgan('dev'))

// CORS middleware configuration
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed request headers
}))

// Parse JSON request bodies
app.use(json())

// Register transit lines routes under /transit-lines endpoint
console.log('Registering transit-lines routes')
app.use('/transit-lines', transitLinesRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});