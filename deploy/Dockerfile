# CampusFound (校园寻物) — all-in-one image
# Builds the React frontend and the Go backend and produces a single
# self-contained binary image. One command to run:
#   docker compose up -d --build
FROM node:24-alpine AS frontend
WORKDIR /web
RUN corepack enable
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
COPY web/patches ./patches
RUN pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm release

FROM golang:1.27-alpine AS backend
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# The frontend built above is embedded into the binary.
COPY --from=frontend /src/server/frontend/dist ./server/frontend/dist
ARG VERSION=development
RUN CGO_ENABLED=0 go build \
    -trimpath \
    -ldflags="-s -w -X github.com/usememos/memos/internal/version.Version=${VERSION} -extldflags '-static'" \
    -tags netgo,osusergo \
    -o /campusfound \
    ./cmd/memos

FROM alpine:3.21
RUN apk add --no-cache tzdata ca-certificates && \
    addgroup -g 10001 -S app && \
    adduser -u 10001 -S -G app -h /var/opt/campusfound app && \
    mkdir -p /var/opt/campusfound && chown -R app:app /var/opt/campusfound
COPY --from=backend /campusfound /usr/local/bin/campusfound
USER app
WORKDIR /var/opt/campusfound
VOLUME /var/opt/campusfound
ENV TZ="UTC" MEMOS_PORT="5230" MEMOS_DATA="/var/opt/campusfound"
EXPOSE 5230
ENTRYPOINT ["/usr/local/bin/campusfound"]
