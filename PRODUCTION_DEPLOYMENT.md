# Production Deployment Guide

## Environment Configuration

### 1. Environment Variables

For production deployment, use environment variables instead of `.env.local`. Set these in your production environment:

```bash
# PostgreSQL Database Configuration
POSTGRES_DB=visitor_counter
POSTGRES_USER=visitor
POSTGRES_PASSWORD=your_secure_production_password
POSTGRES_HOST=localhost
POSTGRES_PORT=35433

# JWT Configuration for Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_for_production
JWT_EXPIRES_IN=7d

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Security Considerations

- Use a strong, unique password for PostgreSQL in production
- Generate a secure JWT secret (at least 32 characters)
- Ensure your domain uses HTTPS
- Consider using environment-specific configuration management

## Application Deployment

### 1. Build the Application

```bash
cd visitor-counter
npm install
npm run build
```

### 2. Start the Application

```bash
npm start
```

### 3. Using PM2 for Process Management

Install PM2 globally:

```bash
npm install -g pm2
```

Create an ecosystem file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'visitor-counter',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/visitor-counter',
    env: {
      NODE_ENV: 'production',
      POSTGRES_DB: 'visitor_counter',
      POSTGRES_USER: 'visitor',
      POSTGRES_PASSWORD: 'your_secure_production_password',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '35433',
      JWT_SECRET: 'your_super_secure_jwt_secret_key_for_production',
      JWT_EXPIRES_IN: '7d',
      NEXT_PUBLIC_APP_URL: 'https://your-domain.com'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Setup

### 1. PostgreSQL Docker Container

Run the PostgreSQL container in production:

```bash
docker run -d \
  --name postgres-visitor-counter \
  -e POSTGRES_DB=visitor_counter \
  -e POSTGRES_USER=visitor \
  -e POSTGRES_PASSWORD=your_secure_production_password \
  -p 35433:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:latest
```

### 2. Database Initialization

Run the database setup script:

```bash
npm run db:setup
```

### 3. Create Admin User

Create an admin user for accessing the dashboard:

```bash
npm run fix-admin
```

## Nginx Configuration

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL Certificate Setup

### Using Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Logging

### 1. Application Logs

Monitor PM2 logs:

```bash
pm2 logs visitor-counter
```

### 2. Database Monitoring

Monitor PostgreSQL container:

```bash
docker logs postgres-visitor-counter
```

### 3. System Monitoring

Consider using tools like:
- PM2 Monitoring: `pm2 monit`
- Docker stats: `docker stats`
- System monitoring tools like Prometheus/Grafana

## Backup Strategy

### 1. Database Backups

Create a backup script:

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
mkdir -p $BACKUP_DIR

docker exec postgres-visitor-counter pg_dump -U visitor visitor_counter > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Set up a cron job for daily backups:

```bash
0 2 * * * /path/to/backup-db.sh
```

### 2. Application Backups

Backup your application files and configuration:

```bash
tar -czf visitor-counter-backup-$(date +%Y%m%d).tar.gz /path/to/visitor-counter
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Allow PostgreSQL only from localhost
sudo ufw allow from 127.0.0.1 to any port 35433

# Enable firewall
sudo ufw enable
```

### 2. System Updates

Regularly update your system:

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Docker Security

- Use specific image versions instead of `latest`
- Regularly update Docker images
- Implement resource limits
- Use Docker secrets for sensitive data

## Troubleshooting

### 1. Application Not Starting

Check PM2 status:
```bash
pm2 status
pm2 logs visitor-counter
```

### 2. Database Connection Issues

Test database connection:
```bash
node test-db-connection.js
```

Check Docker container:
```bash
docker ps
docker logs postgres-visitor-counter
```

### 3. Performance Issues

Monitor resource usage:
```bash
pm2 monit
docker stats
```

## Maintenance

### 1. Regular Tasks

- Update dependencies: `npm update`
- Update Docker images: `docker pull postgres:latest`
- Check logs for errors
- Monitor disk space
- Review security advisories

### 2. Scaling Considerations

- Add more PM2 instances if needed
- Consider database read replicas
- Implement caching (Redis)
- Use CDN for static assets