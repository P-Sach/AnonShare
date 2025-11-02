const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Store active local servers
const activeServers = new Map();

class LocalFileServer {
  constructor(port, filePath, password = null, maxDownloads = null, encryptedText = null) {
    this.port = port;
    this.filePath = filePath;
    this.password = password;
    this.maxDownloads = maxDownloads;
    this.downloadCount = 0;
    this.app = express();
    this.server = null;
    this.fileInfo = null;
    this.encryptedText = encryptedText; // Store encrypted text
    this.isTextMode = !!encryptedText; // Flag for text mode
  }

  start() {
    return new Promise((resolve, reject) => {
      // Setup express app
      this.app.use(cors());
      this.app.use(express.json());

      // Middleware to validate local network access only
      this.app.use((req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        const cleanIP = clientIP.replace(/^::ffff:/, ''); // Remove IPv6 prefix
        
        // Allow localhost
        if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP === '::1') {
          return next();
        }

        // Check if IP is in private network ranges
        const isPrivateIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(cleanIP);
        
        if (!isPrivateIP) {
          console.log(`Rejected connection from non-local IP: ${cleanIP}`);
          return res.status(403).json({ 
            error: 'Access denied: This server only accepts connections from the local network' 
          });
        }

        next();
      });

      // Get file info
      if (this.isTextMode) {
        // Text mode - create virtual file info
        this.fileInfo = {
          name: 'encrypted-message.txt',
          size: this.encryptedText.length,
          type: '.txt'
        };
      } else {
        // File mode - read actual file info
        try {
          const stats = fs.statSync(this.filePath);
          this.fileInfo = {
            name: path.basename(this.filePath),
            size: stats.size,
            type: path.extname(this.filePath)
          };
        } catch (err) {
          return reject(new Error('File not found'));
        }
      }

      // File info endpoint
      this.app.get('/info', (req, res) => {
        res.json({
          name: this.fileInfo.name,
          size: this.fileInfo.size,
          type: this.fileInfo.type,
          passwordProtected: !!this.password,
          downloadCount: this.downloadCount,
          maxDownloads: this.maxDownloads,
          downloadLimitReached: this.maxDownloads !== null && this.downloadCount >= this.maxDownloads,
          isText: this.isTextMode
        });
      });

      // Download endpoint
      this.app.get('/download', (req, res) => {
        // Check password if required
        if (this.password && req.query.password !== this.password) {
          return res.status(401).json({ error: 'Invalid password' });
        }

        // Check download limit
        if (this.maxDownloads !== null && this.downloadCount >= this.maxDownloads) {
          return res.status(403).json({ error: 'Download limit reached' });
        }

        if (this.isTextMode) {
          // Text mode - send encrypted text directly
          this.downloadCount++;
          console.log(`Text view #${this.downloadCount} on port ${this.port}`);

          res.setHeader('Content-Type', 'application/json');
          res.json({
            encryptedText: this.encryptedText,
            hasPassword: !!this.password
          });

          // Auto-stop server if limit reached
          if (this.maxDownloads !== null && this.downloadCount >= this.maxDownloads) {
            console.log(`View limit reached on port ${this.port}. Auto-stopping server...`);
            setTimeout(() => {
              this.stop().then(() => {
                activeServers.delete(this.port);
                console.log(`Server on port ${this.port} auto-stopped after reaching view limit`);
              });
            }, 1000);
          }
        } else {
          // File mode - check if file still exists and stream it
          if (!fs.existsSync(this.filePath)) {
            return res.status(404).json({ error: 'File no longer available' });
          }

          // Increment download count
          this.downloadCount++;
          console.log(`Download #${this.downloadCount} started on port ${this.port}`);

          // Send file
          res.setHeader('Content-Disposition', `attachment; filename="${this.fileInfo.name}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
          const readStream = fs.createReadStream(this.filePath);
          
          readStream.on('end', () => {
            console.log(`Download #${this.downloadCount} completed on port ${this.port}`);
            
            // Auto-stop server if limit reached
            if (this.maxDownloads !== null && this.downloadCount >= this.maxDownloads) {
              console.log(`Download limit reached on port ${this.port}. Auto-stopping server...`);
              setTimeout(() => {
                this.stop().then(() => {
                  activeServers.delete(this.port);
                  console.log(`Server on port ${this.port} auto-stopped after reaching download limit`);
                });
              }, 1000);
            }
          });

          readStream.pipe(res);
        }
      });

      // Health check
      this.app.get('/ping', (req, res) => {
        res.json({ 
          status: 'ok',
          downloadCount: this.downloadCount,
          maxDownloads: this.maxDownloads
        });
      });

      // Start server
      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`Local file server started on port ${this.port}`);
        resolve({
          port: this.port,
          file: this.fileInfo.name
        });
      });

      this.server.on('error', (err) => {
        console.error(`Server error on port ${this.port}:`, err);
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(err);
        }
        // Clean up from active servers on error
        activeServers.delete(this.port);
      });

      this.server.on('close', () => {
        console.log(`Server on port ${this.port} closed`);
        // Clean up from active servers when closed
        activeServers.delete(this.port);
      });
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        console.log(`Stopping server on port ${this.port}...`);
        this.server.close((err) => {
          if (err) {
            console.error(`Error stopping server on port ${this.port}:`, err);
            reject(err);
          } else {
            console.log(`Local file server on port ${this.port} stopped`);
            resolve();
          }
        });
      } else {
        console.log(`No server instance found on port ${this.port}`);
        resolve();
      }
    });
  }
}

// API to manage local servers
const createLocalServer = async (port, filePath, password, maxDownloads = null, encryptedText = null) => {
  // Check if server already exists on this port
  if (activeServers.has(port)) {
    throw new Error(`Server already running on port ${port}`);
  }

  const server = new LocalFileServer(port, filePath, password, maxDownloads, encryptedText);
  await server.start();
  
  activeServers.set(port, server);
  
  return {
    port,
    serverId: port.toString()
  };
};

const stopLocalServer = async (port) => {
  const server = activeServers.get(port);
  if (server) {
    await server.stop();
    activeServers.delete(port);
    return true;
  }
  return false;
};

const getActiveServers = () => {
  return Array.from(activeServers.keys());
};

const getServerStats = (port) => {
  const server = activeServers.get(port);
  if (server) {
    return {
      port: server.port,
      downloadCount: server.downloadCount,
      maxDownloads: server.maxDownloads,
      fileName: server.fileInfo?.name
    };
  }
  return null;
};

module.exports = {
  createLocalServer,
  stopLocalServer,
  getActiveServers,
  getServerStats,
  LocalFileServer
};
