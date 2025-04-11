import { check } from 'k6';
import ws from 'k6/ws';
import http from 'k6/http';

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up to 50 users
    { duration: '1m', target: 50 },    // Hold 50 users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    checks: ['rate > 0.95'],           // 95% success rate
    http_req_duration: ['p(95)<500'],  // 95% of HTTP requests under 500ms
  },
};

// Test logic
export default function () {
  // 1. Authenticate to get JWT cookie
  const loginRes = http.post(
    'https://chat-app-waaf.onrender.com/api/auth/login',
    {
      email: `testuser-${__VU}@example.com`, // Dynamic email per virtual user
      password: 'test123',
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'Login succeeded': (r) => r.status === 200 && r.cookies.jwt, // Check for JWT cookie
  });

  // 2. Extract JWT cookie
  const jwtCookie = loginRes.cookies.jwt[0].value; // Get the JWT token from cookies

  // 3. Connect to Socket.io with JWT cookie
  const socketUrl = 'wss://chat-app-waaf.onrender.com/socket.io/?EIO=4&transport=websocket';
  const socketParams = {
    headers: {
      Cookie: `jwt=${jwtCookie}`, // Pass the JWT cookie
    },
  };

  const res = ws.connect(socketUrl, socketParams, (socket) => {
    socket.on('open', () => {
      socket.send(JSON.stringify({ type: 'join', room: 'load-test' }));
      console.log(`User ${__VU} connected`);
    });

    socket.on('message', (data) => {
      check(data, {
        'Received valid reply': (d) => JSON.parse(d).type === 'ack',
      });
    });

    socket.setInterval(() => {
      socket.send(JSON.stringify({
        type: 'message',
        text: 'Hello from k6 load test!',
      }));
    }, 5000);

    socket.setTimeout(() => {
      socket.close();
    }, 120000);
  });

  check(res, {
    'WebSocket connected': (r) => r && r.status === 101,
  });
}