import { json } from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import { transitLinesRouter } from './api/transit-lines'

export const app = express()

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(morgan('dev'))
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(json())

console.log('Registering transit-lines routes')
app.use('/transit-lines', transitLinesRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});