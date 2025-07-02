# OmniConverter PDF Suite - Coolify Deployment Guide

## Overview
This guide will help you deploy the OmniConverter PDF Suite to Coolify using Docker Compose.

## Port Configuration
The application uses the following ports to avoid conflicts:
- **Frontend**: Port 5174 (instead of 5173)
- **Backend**: Port 5002 (instead of 5001)

## Prerequisites
- Coolify server with Docker support
- Git repository access
- At least 2GB RAM available

## Deployment Steps

### 1. Repository Setup
1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Ensure all files are committed including:
   - `docker-compose.yaml`
   - `Dockerfile.frontend`
   - `server/Dockerfile.backend`
   - `.dockerignore` files

### 2. Coolify Configuration
1. **Create New Application** in Coolify
2. **Source**: Select your Git repository
3. **Build Pack**: Choose "Docker Compose"
4. **Docker Compose File**: `docker-compose.yaml`

### 3. Environment Variables (Optional)
You can set these environment variables in Coolify:
- `NODE_ENV=production`
- `VITE_API_URL=http://backend:5002` (for frontend)
- `PORT=5002` (for backend)

### 4. Resource Allocation
Recommended resources:
- **Frontend**: 512MB RAM, 0.5 CPU
- **Backend**: 1GB RAM, 1 CPU
- **Storage**: 2GB for file uploads

### 5. Volumes
The application creates these volumes automatically:
- `./server/uploads` - For uploaded files
- `./server/temp` - For temporary files
- `./server/temp_pdf` - For PDF processing

### 6. Deploy
1. Click "Deploy" in Coolify
2. Monitor the build logs for any errors
3. Wait for both services to be healthy

## Accessing the Application
- **Frontend**: `http://your-domain:5174`
- **Backend API**: `http://your-domain:5002`

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure ports 5174 and 5002 are available
2. **Memory Issues**: Increase RAM allocation if conversions fail
3. **File Permissions**: Ensure volumes have proper write permissions

### Logs
Check logs in Coolify for:
- Frontend build errors
- Backend startup issues
- PDF conversion failures

### System Dependencies
The backend Docker image includes:
- LibreOffice (for document conversions)
- Tesseract (for OCR)
- Poppler-utils (for PDF manipulation)
- Ghostscript (for PDF processing)
- ImageMagick (for image processing)

## Maintenance
- **Cleanup**: The application automatically cleans up temporary files every 15 minutes
- **Updates**: Pull new code and redeploy through Coolify
- **Backups**: Consider backing up the uploads volume if needed

## Security Notes
- The application runs in production mode
- CORS is enabled for the frontend-backend communication
- File uploads are limited and cleaned up automatically
- No sensitive data is stored permanently

## Support
For issues with the deployment, check:
1. Coolify logs
2. Docker container logs
3. Application console logs 