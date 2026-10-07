# CampusFound（校园寻物）Windows 一键启动脚本
# 用法：右键"使用 PowerShell 运行"，或在 PowerShell 中执行 .\start-campus.ps1
#
# 优先级：本地已有二进制 → 从 GitHub Releases 下载 → 提示使用 Docker。
# 无需安装任何数据库，数据保存在脚本同目录的 campus-data 文件夹。

$ErrorActionPreference = "Stop"
$Repo = if ($env:CAMPUSFOUND_REPO) { $env:CAMPUSFOUND_REPO } else { "your-github-name/memos" }
$Version = if ($env:CAMPUSFOUND_VERSION) { $env:CAMPUSFOUND_VERSION } else { "latest" }
$Port = if ($env:CAMPUSFOUND_PORT) { $env:CAMPUSFOUND_PORT } else { 5230 }
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $Here "campus-data"
$Bin = Join-Path $Here "campusfound.exe"

function Write-Step($msg) { Write-Host "[CampusFound] $msg" -ForegroundColor Cyan }

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

if (-not (Test-Path $Bin)) {
    if ($Version -eq "latest") {
        Write-Step "正在获取最新版本号..."
        try {
            $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers @{ "User-Agent" = "campusfound-installer" }
            $Version = $rel.tag_name
        } catch {
            $Version = $null
        }
    }
    if ($Version) {
        $url = "https://github.com/$Repo/releases/download/$Version/campusfound_windows_amd64.exe"
        Write-Step "正在下载 $url"
        try {
            Invoke-WebRequest -Uri $url -OutFile $Bin -UseBasicParsing
        } catch {
            Write-Step "下载失败（可能尚未发布 Release）。"
        }
    }
}

if (-not (Test-Path $Bin)) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Step "未找到可执行文件，改用 Docker 启动..."
        Set-Location (Join-Path $Here "..")
        docker compose -f deploy/docker-compose.yml up -d --build
        exit $?
    }
    Write-Host @"
未找到 campusfound.exe。两种解决办法（任选其一）：
1. 请先发布 Release（含 campusfound_windows_amd64.exe），或设置环境变量：
   `$env:CAMPUSFOUND_REPO = "你的GitHub用户名/memos"; .\start-campus.ps1
2. 安装 Docker Desktop 后重跑本脚本，将自动改用 Docker 构建启动。
"@ -ForegroundColor Yellow
    exit 1
}

Write-Step "启动 CampusFound，浏览器打开 http://localhost:$Port （Ctrl+C 停止）"
$env:MEMOS_DATA = $DataDir
$env:MEMOS_PORT = "$Port"
& $Bin
