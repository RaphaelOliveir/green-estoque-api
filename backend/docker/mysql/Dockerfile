FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=green_estoque
ENV MYSQL_DATABASE=green_estoque

COPY migrations/001_schema.sql /docker-entrypoint-initdb.d/001_schema.sql
