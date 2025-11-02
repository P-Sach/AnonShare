// API Route Handler for Next.js App Router
import { NextResponse } from 'next/server';

// Lazy load the Express app only when needed
let app;
function getApp() {
  if (!app) {
    try {
      // Dynamic require to avoid bundling issues
      app = require('../../../backend/server');
    } catch (error) {
      console.error('Failed to load backend server:', error);
      throw error;
    }
  }
  return app;
}

// Convert Next.js request to Express-compatible format
async function handleRequest(request, context) {
  try {
    const app = getApp();
    
    if (!app) {
      return NextResponse.json(
        { error: 'Backend server not initialized' },
        { status: 500 }
      );
    }

    const { params } = context;
    const path = params.path ? params.path.join('/') : '';
    const url = new URL(request.url);
    const method = request.method;

    // Get request body for POST/PUT requests
    let body = {};
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
          // For form data, we'll pass the raw request
          body = await request.formData();
        }
      } catch (e) {
        // Body parsing failed, continue with empty body
      }
    }

    // Create a promise to handle the Express app response
    return new Promise((resolve) => {
      // Create mock request object
      const mockReq = {
        method,
        url: `/${path}${url.search}`,
        headers: Object.fromEntries(request.headers),
        body,
        query: Object.fromEntries(url.searchParams),
      };

      // Create mock response object
      const mockRes = {
        statusCode: 200,
        _headers: {},
        _body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this._body = data;
          this._headers['Content-Type'] = 'application/json';
          resolve(NextResponse.json(data, {
            status: this.statusCode,
            headers: this._headers
          }));
          return this;
        },
        send(data) {
          this._body = data;
          const response = typeof data === 'object'
            ? NextResponse.json(data, { status: this.statusCode, headers: this._headers })
            : new NextResponse(data, { status: this.statusCode, headers: this._headers });
          resolve(response);
          return this;
        },
        setHeader(key, value) {
          this._headers[key] = value;
          return this;
        },
        end(data) {
          if (data) {
            this.send(data);
          } else {
            resolve(new NextResponse(this._body, {
              status: this.statusCode,
              headers: this._headers
            }));
          }
        },
      };

      // Handle the request with Express app
      try {
        app.handle(mockReq, mockRes, (err) => {
          if (err) {
            console.error('Express error:', err);
            resolve(NextResponse.json(
              { error: 'Internal server error', message: err.message },
              { status: 500 }
            ));
          }
        });
      } catch (error) {
        console.error('Request handling error:', error);
        resolve(NextResponse.json(
          { error: 'Failed to process request', message: error.message },
          { status: 500 }
        ));
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, context) {
  return handleRequest(request, context);
}

export async function POST(request, context) {
  return handleRequest(request, context);
}

export async function PUT(request, context) {
  return handleRequest(request, context);
}

export async function DELETE(request, context) {
  return handleRequest(request, context);
}

export async function PATCH(request, context) {
  return handleRequest(request, context);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
