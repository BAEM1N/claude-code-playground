# Ubuntu 서버 배포 가이드 (모놀리스 구조)

> 단일 Ubuntu 서버에서 프론트엔드와 백엔드를 모두 실행하는 가이드입니다.

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [1단계: 서버 준비](#1단계-서버-준비)
3. [2단계: 필수 소프트웨어 설치](#2단계-필수-소프트웨어-설치)
4. [3단계: 프로젝트 설정](#3단계-프로젝트-설정)
5. [4단계: 백엔드 설정](#4단계-백엔드-설정)
6. [5단계: 프론트엔드 빌드](#5단계-프론트엔드-빌드)
7. [6단계: Nginx 설정](#6단계-nginx-설정)
8. [7단계: 서비스 등록 및 시작](#7단계-서비스-등록-및-시작)
9. [8단계: SSL/HTTPS 설정 (선택)](#8단계-sslhttps-설정-선택)
10. [관리 및 모니터링](#관리-및-모니터링)
11. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 최소 사양
- **OS**: Ubuntu 20.04 LTS 이상 (22.04 LTS 권장)
- **CPU**: 2 코어
- **RAM**: 4GB
- **디스크**: 20GB 이상

### 권장 사양
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 코어
- **RAM**: 8GB
- **디스크**: 50GB 이상 (SSD)

### 필요한 포트
- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx)
- **8000**: 백엔드 API (내부 전용)
- **6379**: Redis (내부 전용)
- **9000**: MinIO API (내부 전용)
- **9001**: MinIO Console (내부 전용)

---

## 1단계: 서버 준비

### 1.1 서버 접속
```bash
ssh user@your-server-ip
```

### 1.2 시스템 업데이트
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 필수 도구 설치
```bash
sudo apt install -y curl wget git build-essential libssl-dev
```

### 1.4 방화벽 설정 (UFW)
```bash
# UFW 활성화
sudo ufw enable

# SSH 포트 허용 (연결이 끊기지 않도록 먼저 설정)
sudo ufw allow 22/tcp

# HTTP/HTTPS 포트 허용
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 상태 확인
sudo ufw status
```

---

## 2단계: 필수 소프트웨어 설치

### 2.1 Python 3.11 설치
```bash
# Python 3.11 설치
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# pip 설치
curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.11

# 기본 Python 버전 확인
python3.11 --version
```

### 2.2 Node.js 20.x 설치
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 버전 확인
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.3 Redis 설치
```bash
# Redis 설치
sudo apt install -y redis-server

# Redis 설정 수정 (보안)
sudo sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf

# Redis 시작 및 자동 시작 설정
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 상태 확인
sudo systemctl status redis-server
redis-cli ping  # 응답: PONG
```

### 2.4 PostgreSQL 설치 (SQLite 대신 운영용)
```bash
# PostgreSQL 15 설치
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 생성
sudo -u postgres psql -c "CREATE DATABASE courseplatform;"
sudo -u postgres psql -c "CREATE USER courseuser WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE courseplatform TO courseuser;"
sudo -u postgres psql -d courseplatform -c "GRANT ALL ON SCHEMA public TO courseuser;"

# 연결 확인
psql -U courseuser -d courseplatform -h localhost -W
```

### 2.5 MinIO 설치 (S3 호환 스토리지)
```bash
# MinIO 다운로드
wget https://dl.min.io/server/minio/release/linux-amd64/minio
sudo chmod +x minio
sudo mv minio /usr/local/bin/

# MinIO 사용자 생성
sudo useradd -r minio-user -s /sbin/nologin

# MinIO 데이터 디렉토리 생성
sudo mkdir -p /mnt/minio/data
sudo chown -R minio-user:minio-user /mnt/minio

# MinIO 환경 변수 파일 생성
sudo tee /etc/default/minio > /dev/null <<EOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
MINIO_VOLUMES="/mnt/minio/data"
MINIO_OPTS="--console-address :9001"
EOF

# 권한 설정
sudo chmod 640 /etc/default/minio
```

### 2.6 Nginx 설치
```bash
# Nginx 설치
sudo apt install -y nginx

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx

# 상태 확인
sudo systemctl status nginx
```

---

## 3단계: 프로젝트 설정

### 3.1 프로젝트 디렉토리 생성
```bash
# 배포 디렉토리 생성
sudo mkdir -p /var/www
cd /var/www
```

### 3.2 레포지토리 클론
```bash
# Git 저장소 클론
sudo git clone https://github.com/your-username/claude-code-playground.git
sudo chown -R $USER:$USER claude-code-playground
cd claude-code-playground
```

---

## 4단계: 백엔드 설정

### 4.1 Python 가상환경 생성
```bash
cd /var/www/claude-code-playground/backend

# 가상환경 생성
python3.11 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.2 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**중요: 다음 값들을 반드시 수정하세요:**

```bash
# Application
APP_NAME="Course Management Platform"
DEBUG=False  # 프로덕션에서는 False
ENVIRONMENT=production

# Server
HOST=127.0.0.1  # 내부 전용
PORT=8000

# Database (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://courseuser:your_secure_password@localhost:5432/courseplatform

# Supabase (본인의 Supabase 프로젝트 정보)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_password  # /etc/default/minio 파일에서 확인
MINIO_BUCKET_NAME=course-files
MINIO_SECURE=False

# CORS (프로덕션 도메인)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security (새로운 랜덤 키 생성)
SECRET_KEY=$(openssl rand -hex 32)
```

### 4.3 데이터베이스 마이그레이션
```bash
# Alembic 마이그레이션 실행
alembic upgrade head

# 초기 데이터 생성 (선택 사항)
python scripts/seed_data.py  # 스크립트가 있는 경우
```

### 4.4 systemd 서비스 파일 생성

백엔드를 시스템 서비스로 등록합니다:

```bash
sudo nano /etc/systemd/system/courseplatform-backend.service
```

다음 내용을 입력:

```ini
[Unit]
Description=Course Platform Backend API
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/claude-code-playground/backend
Environment="PATH=/var/www/claude-code-playground/backend/venv/bin"
ExecStart=/var/www/claude-code-playground/backend/venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 4 \
    --log-level info

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 4.5 MinIO systemd 서비스 생성
```bash
sudo nano /etc/systemd/system/minio.service
```

다음 내용을 입력:

```ini
[Unit]
Description=MinIO Object Storage
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
Type=notify
User=minio-user
Group=minio-user
EnvironmentFile=/etc/default/minio
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 5단계: 프론트엔드 빌드

### 5.1 의존성 설치
```bash
cd /var/www/claude-code-playground/frontend

# 의존성 설치
npm install --legacy-peer-deps
```

### 5.2 환경 변수 설정
```bash
# .env.production 파일 생성
nano .env.production
```

다음 내용을 입력:

```bash
# API Configuration (프로덕션 도메인)
REACT_APP_API_URL=https://yourdomain.com
REACT_APP_WS_URL=wss://yourdomain.com

# Supabase Configuration (백엔드와 동일)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Features
REACT_APP_FEATURE_WEBSOCKET=true
REACT_APP_FEATURE_NOTIFICATIONS=true
REACT_APP_FEATURE_FILE_UPLOAD=true

# Debug
REACT_APP_DEBUG=false
```

### 5.3 프로덕션 빌드
```bash
# 프로덕션 빌드 실행
npm run build

# 빌드 결과 확인
ls -lh build/
```

빌드가 완료되면 `build/` 디렉토리가 생성됩니다.

---

## 6단계: Nginx 설정

### 6.1 Nginx 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/courseplatform
```

다음 내용을 입력:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

# Upstream 백엔드
upstream backend {
    server 127.0.0.1:8000;
}

# HTTP to HTTPS 리다이렉트 (SSL 설정 후)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt 인증을 위한 경로
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 나머지는 HTTPS로 리다이렉트 (SSL 설정 후 주석 해제)
    # return 301 https://$server_name$request_uri;
}

# HTTPS 서버
server {
    listen 80;  # SSL 설정 후 443으로 변경
    # listen 443 ssl http2;
    # listen [::]:443 ssl http2;

    server_name yourdomain.com www.yourdomain.com;

    # SSL 인증서 경로 (Let's Encrypt 설정 후 주석 해제)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    # ssl_protocols TLSv1.2 TLSv1.3;
    # ssl_ciphers HIGH:!aNULL:!MD5;
    # ssl_prefer_server_ciphers on;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 로그
    access_log /var/log/nginx/courseplatform-access.log;
    error_log /var/log/nginx/courseplatform-error.log;

    # 최대 업로드 크기
    client_max_body_size 100M;

    # 프론트엔드 정적 파일
    root /var/www/claude-code-playground/frontend/build;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API 프록시
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 타임아웃
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 프록시
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 타임아웃
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # MinIO 프록시 (관리자용)
    location /minio/ {
        proxy_pass http://127.0.0.1:9001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 프론트엔드 라우팅 (React Router)
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Nginx 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/courseplatform /etc/nginx/sites-enabled/

# 기본 설정 비활성화
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 7단계: 서비스 등록 및 시작

### 7.1 서비스 데몬 리로드
```bash
sudo systemctl daemon-reload
```

### 7.2 MinIO 시작
```bash
# MinIO 서비스 시작
sudo systemctl start minio
sudo systemctl enable minio

# 상태 확인
sudo systemctl status minio

# MinIO 초기 설정
# 웹 브라우저에서 http://your-server-ip:9001 접속
# /etc/default/minio 파일의 credentials로 로그인
# 버킷 생성: course-files
```

### 7.3 백엔드 시작
```bash
# 파일 권한 설정
sudo chown -R www-data:www-data /var/www/claude-code-playground

# 백엔드 서비스 시작
sudo systemctl start courseplatform-backend
sudo systemctl enable courseplatform-backend

# 상태 확인
sudo systemctl status courseplatform-backend

# 로그 확인
sudo journalctl -u courseplatform-backend -f
```

### 7.4 서비스 상태 확인
```bash
# 모든 서비스 확인
sudo systemctl status postgresql redis-server minio courseplatform-backend nginx

# 포트 확인
sudo netstat -tlnp | grep -E ':(80|443|8000|6379|9000|9001)\s'
```

---

## 8단계: SSL/HTTPS 설정 (선택)

### 8.1 Certbot 설치
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 SSL 인증서 발급
```bash
# Let's Encrypt 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 이메일 입력 및 약관 동의
# Nginx 설정 자동 업데이트 선택
```

### 8.3 자동 갱신 설정
```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# Cron job은 자동으로 설정됨 (/etc/cron.d/certbot)
```

### 8.4 Nginx 재시작
```bash
sudo systemctl restart nginx
```

---

## 관리 및 모니터링

### 서비스 관리 명령어

#### 백엔드 관리
```bash
# 상태 확인
sudo systemctl status courseplatform-backend

# 시작/중지/재시작
sudo systemctl start courseplatform-backend
sudo systemctl stop courseplatform-backend
sudo systemctl restart courseplatform-backend

# 로그 확인
sudo journalctl -u courseplatform-backend -f
sudo journalctl -u courseplatform-backend --since "1 hour ago"
```

#### Nginx 관리
```bash
# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 로그 확인
sudo tail -f /var/log/nginx/courseplatform-access.log
sudo tail -f /var/log/nginx/courseplatform-error.log
```

#### MinIO 관리
```bash
# 상태 확인
sudo systemctl status minio

# 재시작
sudo systemctl restart minio

# 로그 확인
sudo journalctl -u minio -f
```

### 데이터베이스 백업
```bash
# PostgreSQL 백업
sudo -u postgres pg_dump courseplatform > /backup/courseplatform_$(date +%Y%m%d).sql

# 복원
sudo -u postgres psql courseplatform < /backup/courseplatform_20250101.sql
```

### 로그 로테이션
```bash
# 로그 로테이션 설정 생성
sudo nano /etc/logrotate.d/courseplatform
```

내용:
```
/var/log/nginx/courseplatform-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 업데이트 배포

#### 백엔드 업데이트
```bash
cd /var/www/claude-code-playground
sudo git pull origin main

cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

sudo systemctl restart courseplatform-backend
```

#### 프론트엔드 업데이트
```bash
cd /var/www/claude-code-playground/frontend
npm install --legacy-peer-deps
npm run build

sudo systemctl restart nginx
```

---

## 문제 해결

### 1. 백엔드가 시작되지 않을 때

**증상**: `systemctl status courseplatform-backend`에서 failed 상태

**확인 사항**:
```bash
# 로그 확인
sudo journalctl -u courseplatform-backend -n 100 --no-pager

# 수동 실행으로 에러 확인
cd /var/www/claude-code-playground/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**일반적인 원인**:
- 데이터베이스 연결 실패 → `.env` 파일의 `DATABASE_URL` 확인
- Redis 연결 실패 → `redis-server` 상태 확인
- MinIO 연결 실패 → `minio` 서비스 상태 확인
- 포트 충돌 → `sudo netstat -tlnp | grep 8000`

### 2. 502 Bad Gateway 에러

**원인**: Nginx가 백엔드에 연결할 수 없음

**해결**:
```bash
# 백엔드 상태 확인
sudo systemctl status courseplatform-backend

# 백엔드가 8000 포트를 듣고 있는지 확인
curl http://127.0.0.1:8000/health

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/courseplatform-error.log
```

### 3. 파일 업로드 실패

**원인**: MinIO 연결 문제 또는 버킷 없음

**해결**:
```bash
# MinIO 상태 확인
sudo systemctl status minio

# MinIO 웹 콘솔 접속 (http://server-ip:9001)
# course-files 버킷이 존재하는지 확인
```

### 4. WebSocket 연결 실패

**원인**: Nginx WebSocket 프록시 설정 문제

**해결**:
```bash
# Nginx 설정 확인
sudo nginx -t

# WebSocket 엔드포인트 테스트
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/ws
```

### 5. 데이터베이스 마이그레이션 실패

**해결**:
```bash
cd /var/www/claude-code-playground/backend
source venv/bin/activate

# 현재 마이그레이션 상태 확인
alembic current

# 마이그레이션 히스토리 확인
alembic history

# 특정 버전으로 롤백
alembic downgrade -1

# 다시 업그레이드
alembic upgrade head
```

---

## 보안 체크리스트

배포 전 반드시 확인:

- [ ] `.env` 파일의 `SECRET_KEY`를 새로운 랜덤 값으로 변경
- [ ] `.env` 파일의 `DEBUG=False` 설정
- [ ] PostgreSQL 비밀번호 변경
- [ ] MinIO 비밀번호 변경 (`/etc/default/minio`)
- [ ] Supabase credentials 설정
- [ ] CORS_ORIGINS에 실제 도메인만 포함
- [ ] UFW 방화벽 활성화
- [ ] SSL/HTTPS 설정 완료
- [ ] 정기 백업 스크립트 설정
- [ ] 로그 로테이션 설정
- [ ] 파일 권한 확인 (`.env` 파일은 600)

---

## 모니터링

### 시스템 리소스 모니터링
```bash
# CPU/메모리 사용량
htop

# 디스크 사용량
df -h

# 서비스별 메모리 사용량
sudo systemctl status courseplatform-backend | grep Memory
```

### 애플리케이션 모니터링 (선택 사항)

**Prometheus + Grafana 설치 예시**:
```bash
# 추후 필요 시 구현
```

---

## 성능 튜닝

### Uvicorn Workers 조정
```bash
# /etc/systemd/system/courseplatform-backend.service
# --workers 값을 CPU 코어 수에 맞게 조정
# 권장: (CPU 코어 수 * 2) + 1
```

### PostgreSQL 최적화
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf

# 메모리 설정 (총 RAM의 25%)
shared_buffers = 2GB
effective_cache_size = 6GB
```

### Redis 최적화
```bash
sudo nano /etc/redis/redis.conf

# 최대 메모리 설정
maxmemory 1gb
maxmemory-policy allkeys-lru
```

---

## 빠른 명령어 참조

```bash
# 전체 서비스 재시작
sudo systemctl restart postgresql redis-server minio courseplatform-backend nginx

# 전체 서비스 상태 확인
sudo systemctl status postgresql redis-server minio courseplatform-backend nginx

# 로그 실시간 모니터링
sudo journalctl -u courseplatform-backend -f

# 프로젝트 업데이트
cd /var/www/claude-code-playground && \
sudo git pull && \
cd backend && source venv/bin/activate && pip install -r requirements.txt && alembic upgrade head && \
cd ../frontend && npm install --legacy-peer-deps && npm run build && \
sudo systemctl restart courseplatform-backend nginx
```

---

## 추가 리소스

- [FastAPI 배포 가이드](https://fastapi.tiangolo.com/deployment/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)
- [Let's Encrypt 가이드](https://letsencrypt.org/getting-started/)
- [PostgreSQL 튜닝](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)

---

**배포 완료!** 🎉

이제 `https://yourdomain.com`으로 접속하여 플랫폼을 사용할 수 있습니다.

문제가 발생하면 [문제 해결](#문제-해결) 섹션을 참조하거나 로그를 확인하세요.
