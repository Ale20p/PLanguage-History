# PLanguage History API

Spring Boot REST API for the programming language graph.

## Local Development

Start PostgreSQL from the repository root:

```bash
docker compose up -d postgres
```

Then run the API from this directory:

```bash
./mvnw.cmd spring-boot:run
```

The local API is available at:

```text
http://localhost:8081/api/v1
```

Health check:

```text
http://localhost:8081/actuator/health
```

## Production Environment

Deploy the backend as a Java service or Docker container on a host such as Render, Railway, Fly.io, AWS, Azure, or GCP. Cloudflare Pages should keep hosting only the static frontend.

Required environment variables:

```bash
PORT=8081
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/database
SPRING_DATASOURCE_USERNAME=database_user
SPRING_DATASOURCE_PASSWORD=database_password
CORS_ALLOWED_ORIGINS=https://planguage-history.pages.dev
```

If your database provider gives a URL like `postgresql://user:password@host:5432/db`, convert it to a JDBC URL:

```text
jdbc:postgresql://host:5432/db
```

Keep the username and password in `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`.

## Docker

Build from the `backend` directory:

```bash
docker build -t planguage-history-api .
```

Run:

```bash
docker run --rm -p 8081:8081 --env-file .env.example planguage-history-api
```

After deployment, set the Cloudflare Pages frontend variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com/api/v1
```
