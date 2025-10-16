# Docker Configuration for PostgreSQL

## Current Setup

Your visitor-counter application connects to a PostgreSQL database running in a Docker container. The container exposes PostgreSQL on port 35433 of the host machine.

## Docker Container Configuration

### Running PostgreSQL Container

Use this command to run PostgreSQL with the correct port mapping:

```bash
docker run -d \
  --name postgres-visitor-counter \
  -e POSTGRES_DB=visitor_counter \
  -e POSTGRES_USER=visitor \
  -e POSTGRES_PASSWORD=visitor@#1234 \
  -p 35433:5432 \
  --restart unless-stopped \
  postgres:latest
```

### Explanation of Parameters

- `-d`: Run container in detached mode
- `--name postgres-visitor-counter`: Give the container a recognizable name
- `-e POSTGRES_DB=visitor_counter`: Database name (matches your .env.local)
- `-e POSTGRES_USER=visitor`: Database user (matches your .env.local)
- `-e POSTGRES_PASSWORD=visitor@#1234`: Database password (matches your .env.local)
- `-p 35433:5432`: Map host port 35433 to container port 5432
- `--restart unless-stopped`: Automatically restart container if it crashes
- `postgres:latest`: Use the latest PostgreSQL image

### Docker Compose Alternative

Create a `docker-compose.yml` file for easier management:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:latest
    container_name: postgres-visitor-counter
    environment:
      POSTGRES_DB: visitor_counter
      POSTGRES_USER: visitor
      POSTGRES_PASSWORD: visitor@#1234
    ports:
      - "35433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with: `docker-compose up -d`

## Connection Details

Your application connects to PostgreSQL using these parameters:

- **Host**: 183.91.79.108 (public IP of the VPS)
- **Port**: 35433 (the exposed port on the host)
- **Database**: visitor_counter
- **User**: visitor
- **Password**: visitor@#1234

**Important**: The application is connecting via the public IP address, not localhost. This means:
- The PostgreSQL container must be accessible from external connections
- Firewall rules must allow connections to port 35433
- Consider security implications of exposing PostgreSQL to the internet

## Troubleshooting

### Check if Container is Running

```bash
docker ps
```

Look for a container with name `postgres-visitor-counter` and port mapping `0.0.0.0:35433->5432/tcp`

### Check Container Logs

```bash
docker logs postgres-visitor-counter
```

### Test Connection from Host

```bash
# Install postgres client if needed
apt-get install postgresql-client

# Test connection
psql -h localhost -p 35433 -U visitor -d visitor_counter
```

### Restart Container

```bash
docker restart postgres-visitor-counter
```

### Stop Container

```bash
docker stop postgres-visitor-counter
```

## Backup Recommendations

For production, implement regular backups:

```bash
# Create backup
docker exec postgres-visitor-counter pg_dump -U visitor visitor_counter > backup.sql

# Restore backup
docker exec -i postgres-visitor-counter psql -U visitor visitor_counter < backup.sql
```

## Security Considerations

1. Change the default password in production
2. Consider using Docker networks for better isolation
3. Implement proper firewall rules to restrict access
4. Use SSL connections if handling sensitive data