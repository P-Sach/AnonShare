const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const getUploadDir = require('../utils/uploadPath');
const { createLocalServer, stopLocalServer, getActiveServers, getServerStats } = require('../services/localServer');

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get local IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  let fallbackIP = 'localhost';
  
  // Priority order: Wi-Fi, Ethernet, others
  const priorityNames = ['Wi-Fi', 'WiFi', 'WLAN', 'Ethernet', 'eth0', 'en0', 'en1'];
  
  // First, try priority interfaces
  for (const priorityName of priorityNames) {
    if (interfaces[priorityName]) {
      for (const iface of interfaces[priorityName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Using network interface: ${priorityName} - ${iface.address}`);
          return iface.address;
        }
      }
    }
  }
  
  // Fallback: try any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Using network interface: ${name} - ${iface.address}`);
        return iface.address;
      }
    }
  }
  
  console.warn('No suitable network interface found, using localhost');
  return fallbackIP;
};

// Start local server
router.post('/start', upload.single('file'), async (req, res) => {
  try {
    console.log('📡 Starting local server...');
    const { port, password, maxDownloads, encryptedText } = req.body;
    const file = req.file;

    // Either file or text must be provided
    if (!file && !encryptedText) {
      console.error('❌ No file or text provided');
      return res.status(400).json({ error: 'No file or text provided' });
    }

    if (!port || isNaN(port) || port < 1024 || port > 65535) {
      console.error('❌ Invalid port:', port);
      return res.status(400).json({ error: 'Invalid port number. Must be between 1024 and 65535' });
    }

    const portNumber = parseInt(port);
    const maxDL = maxDownloads ? parseInt(maxDownloads) : null;

    let serverInfo;
    let fileName = null;
    
    if (file) {
      // File sharing mode
      console.log(`📁 File mode: ${file.originalname}`);
      const filePath = file.path;
      fileName = file.originalname;
      serverInfo = await createLocalServer(portNumber, filePath, password || null, maxDL);
    } else {
      // Text sharing mode
      console.log(`💬 Text mode: ${encryptedText?.length} characters`);
      fileName = 'encrypted-message.txt';
      serverInfo = await createLocalServer(portNumber, null, password || null, maxDL, encryptedText);
    }

    // Get local IP
    const localIP = getLocalIP();
    console.log(`✅ Server started on ${localIP}:${portNumber}`);

    // Generate access key
    const accessInfo = {
      host: localIP,
      port: portNumber,
      fileName: fileName,
      password: password || null,
      isText: !file // Mark as text share
    };

    const accessKey = Buffer.from(JSON.stringify(accessInfo)).toString('base64');

    res.json({
      success: true,
      accessKey,
      localIP,
      port: portNumber,
      fileName: fileName,
      maxDownloads: maxDL,
      isText: !file
    });
  } catch (error) {
    console.error('❌ Error starting local server:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to start local server'
    });
  }
});

// Stop local server
router.post('/stop', async (req, res) => {
  try {
    console.log('🛑 Stopping local server...');
    const { port } = req.body;

    if (!port) {
      console.error('❌ No port provided');
      return res.status(400).json({ error: 'Port number required' });
    }

    const portNumber = parseInt(port);
    console.log(`Attempting to stop server on port ${portNumber}...`);

    const stopped = await stopLocalServer(portNumber);

    if (stopped) {
      console.log(`✅ Server on port ${portNumber} stopped successfully`);
      res.json({ success: true, message: 'Server stopped' });
    } else {
      console.warn(`⚠️ Server on port ${portNumber} not found`);
      res.status(404).json({ error: 'Server not found' });
    }
  } catch (error) {
    console.error('❌ Error stopping local server:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to stop server' });
  }
});

// Check if port is available
router.get('/check-port/:port', (req, res) => {
  const port = parseInt(req.params.port);
  
  if (isNaN(port) || port < 1024 || port > 65535) {
    return res.json({ available: false, reason: 'Invalid port number' });
  }

  // Check if we already have a server running on this port
  const activeServers = getActiveServers();
  if (activeServers.includes(port)) {
    return res.json({ available: false, reason: 'Port already in use by another local share' });
  }

  const net = require('net');
  
  // First, try to connect to the port to see if something is listening
  const client = new net.Socket();
  let connectionAttempted = false;

  client.setTimeout(1000); // 1 second timeout

  client.on('connect', () => {
    // Port is in use (something is listening)
    client.destroy();
    res.json({ available: false, reason: 'Port already in use' });
    connectionAttempted = true;
  });

  client.on('timeout', () => {
    // Timeout means no one is listening, but let's verify by trying to bind
    client.destroy();
    if (!connectionAttempted) {
      tryBindPort();
    }
  });

  client.on('error', (err) => {
    // Connection refused or other error means likely nothing is listening
    client.destroy();
    if (!connectionAttempted && err.code === 'ECONNREFUSED') {
      tryBindPort();
    } else if (err.code === 'EADDRINUSE') {
      res.json({ available: false, reason: 'Port already in use' });
      connectionAttempted = true;
    } else {
      // Other errors, let's try binding
      if (!connectionAttempted) {
        tryBindPort();
      }
    }
  });

  // Attempt to connect
  client.connect(port, 'localhost');

  // Helper function to try binding to the port
  function tryBindPort() {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        res.json({ available: false, reason: 'Port already in use' });
      } else {
        res.json({ available: false, reason: err.message });
      }
    });

    server.once('listening', () => {
      server.close(() => {
        res.json({ available: true });
      });
    });

    server.listen(port, 'localhost');
  }
});

// Get server stats
router.get('/stats/:port', (req, res) => {
  const port = parseInt(req.params.port);
  
  if (isNaN(port)) {
    return res.status(400).json({ error: 'Invalid port number' });
  }

  const stats = getServerStats(port);
  
  if (stats) {
    res.json(stats);
  } else {
    res.status(404).json({ error: 'Server not found on this port' });
  }
});

// Get local IP for debugging/verification
router.get('/local-ip', (req, res) => {
  const localIP = getLocalIP();
  const interfaces = os.networkInterfaces();
  
  // Return all network interfaces for debugging
  const allIPs = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allIPs.push({
          name,
          address: iface.address,
          selected: iface.address === localIP
        });
      }
    }
  }
  
  res.json({
    localIP,
    allInterfaces: allIPs
  });
});

module.exports = router;
