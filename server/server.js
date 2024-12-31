const express = require('express');
const cors_proxy = require('cors-anywhere');
const bodyParser = require('body-parser');
const cors = require('cors');
// const tokenRoutes = require('./routes/tokenRoutes');

// Initialize the Express app
const app = express();
const port = 3000;
const host = 'localhost';
const proxyPort = 8080;

// Middleware for CORS and body parsing
app.use(cors());
app.use(bodyParser.json());

// Main server route (basic check)
app.get('/api', (req, res) => {
    res.send('Main server is running!');
});

// Set up routes related to token data
// app.use('/api/tokens', tokenRoutes);

// Set up CORS Proxy
cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: [],
    removeHeaders: ['cookie', 'cookie2'],
}).listen(proxyPort, host, () => {
    console.log(`CORS Proxy running on http://${host}:${proxyPort}`);
});

// Start the main server
app.listen(port, () => {
    console.log(`Main server running at http://localhost:${port}`);
});