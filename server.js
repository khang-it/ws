// index.js
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const app = express();


// # nếu chưa có: npm install -g wscat
// wscat -c ws://localhost:3000/ws

// Allow CORS from any origin
app.use(cors({ origin: '*' }));

// Simple JSON API
app.get('/api/demo', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Hello from demo API',
        timestamp: new Date().toISOString()
    });
});

// You can add more routes
app.get('/', (req, res) => {
    res.send('Visit /api/demo for JSON or connect via WebSocket on the same port');
});

// Create HTTP server from express app
const server = http.createServer(app);

// Create WebSocket server attached to the same HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    // Optionally inspect req.headers.origin if you want to check origin manually
    console.log('New WebSocket connection');

    // Send a welcome JSON message (stringify before sending)
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WebSocket demo', time: new Date().toISOString() }));

    // Echo and broadcast incoming messages as JSON
    ws.on('message', (data) => {
        console.log('Received:', data.toString());

        // Try to handle JSON or plain text
        let payload;
        try {
            payload = JSON.parse(data);
        } catch {
            payload = { text: data.toString() };
        }

        // Broadcast to all clients
        const outgoing = JSON.stringify({ type: 'broadcast', from: req.socket.remoteAddress, payload, time: new Date().toISOString() });
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) client.send(outgoing);
        });
    });

    ws.on('close', () => {
        console.log('WebSocket disconnected');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`HTTP server + WebSocket running on http://localhost:${PORT}`);
    console.log(`HTTP demo endpoint: http://localhost:${PORT}/api/demo`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
