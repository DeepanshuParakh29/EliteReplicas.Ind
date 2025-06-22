# Elite Replicas - Production Deployment Guide

This guide provides instructions for deploying Elite Replicas to a production environment.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- PM2 (for process management without Docker)
- PostgreSQL database (if not using a managed database service)
- Firebase project with required services enabled

## Environment Variables

Copy the example environment file and update the values:

```bash
cp .env.example .env.production
```

Update the `.env.production` file with your production configuration.

## Building for Production

### Option 1: Using Docker (Recommended)

1. Build and start the containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. View logs:
   ```bash
   docker logs -f elite-replicas
   ```

### Option 2: Manual Deployment

1. Install dependencies:
   ```bash
   npm ci --production=false
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Start the application with PM2:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   ```

4. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Database Migrations

Run database migrations:

```bash
npm run db:push
```

## Environment Variables

Ensure these environment variables are set in your production environment:

- `NODE_ENV=production`
- `PORT` - The port your server should listen on
- `DATABASE_URL` - PostgreSQL connection string
- Firebase configuration variables
- Session secret
- Any other service-specific variables

## Monitoring

- Use PM2's built-in monitoring:
  ```bash
  pm2 monit
  ```

- View logs:
  ```bash
  pm2 logs
  ```

## Updating the Application

1. Pull the latest changes
2. Rebuild the application
3. Restart the service:
   ```bash
   # With Docker
   docker-compose -f docker-compose.prod.yml up -d --build
   
   # With PM2
   pm2 restart ecosystem.config.js --env production
   ```

## Backup and Recovery

### Database Backups

Set up regular backups of your PostgreSQL database. Example backup command:

```bash
pg_dump -U username -d dbname -f backup_$(date +%Y%m%d).sql
```

### File Storage

If using local file storage, ensure regular backups of the uploads directory.

## Security Considerations

- Use HTTPS in production
- Set appropriate CORS headers
- Keep dependencies updated
- Use environment variables for sensitive data
- Implement rate limiting
- Set up proper firewall rules

## Troubleshooting

- Check application logs: `pm2 logs` or `docker logs`
- Verify environment variables are set correctly
- Check database connection
- Verify required ports are open

## Support

For support, please contact [Your Support Email].
