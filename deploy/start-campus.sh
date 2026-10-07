#!/bin/sh
# CampusFound（校园寻物）macOS / Linux 一键启动脚本
# 用法：sh deploy/start-campus.sh
#
# 优先级：本地已有二进制 → 从 GitHub Releases 下载 → 使用 Docker 构建。
set -eu

REPO="${CAMPUSFOUND_REPO:-your-github-name/memos}"
VERSION="${CAMPUSFOUND_VERSION:-latest}"
PORT="${CAMPUSFOUND_PORT:-5230}"
HERE="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$HERE/campus-data"
BIN="$HERE/campusfound"

log() { printf '\033[36m[CampusFound]\033[0m %s\n' "$*"; }

mkdir -p "$DATA_DIR"

if [ ! -x "$BIN" ]; then
  if [ "$VERSION" = "latest" ]; then
    log "正在获取最新版本号..."
    VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1 || true)"
  fi
  if [ -n "${VERSION:-}" ]; then
    OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
    ARCH="$(uname -m)"
    case "$ARCH" in
      x86_64|amd64) ARCH="amd64" ;;
      aarch64|arm64) ARCH="arm64" ;;
      *) ARCH="" ;;
    esac
    if [ -n "$ARCH" ]; then
      URL="https://github.com/$REPO/releases/download/$VERSION/campusfound_${OS}_${ARCH}"
      log "正在下载 $URL"
      if curl -fSL "$URL" -o "$BIN"; then
        chmod +x "$BIN"
      else
        rm -f "$BIN"
        log "下载失败（可能尚未发布 Release）。"
      fi
    fi
  fi
fi

if [ ! -x "$BIN" ]; then
  if command -v docker >/dev/null 2>&1; then
    log "未找到可执行文件，改用 Docker 启动..."
    cd "$HERE/.."
    docker compose -f deploy/docker-compose.yml up -d --build
    exit 0
  fi
  cat <<'EOF'
未找到 campusfound 可执行文件。两种解决办法（任选其一）：
1. 发布 Release（含 campusfound_<os>_<arch> 二进制）后设置环境变量重跑：
   CAMPUSFOUND_REPO=你的GitHub用户名/memos sh deploy/start-campus.sh
2. 安装 Docker 后重跑本脚本，将自动改用 Docker 构建启动。
EOF
  exit 1
fi

log "启动 CampusFound，浏览器打开 http://localhost:$PORT （Ctrl+C 停止）"
MEMOS_DATA="$DATA_DIR" MEMOS_PORT="$PORT" "$BIN"
