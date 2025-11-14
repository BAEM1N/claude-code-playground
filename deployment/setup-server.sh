#!/bin/bash

###############################################################################
# Course Platform 서버 초기 설정 스크립트
# 새로운 Ubuntu 서버에서 실행하여 모든 소프트웨어를 설치하고 설정합니다
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# root 권한 확인
if [[ $EUID -ne 0 ]]; then
   log_error "이 스크립트는 root 권한이 필요합니다. sudo로 실행하세요."
   exit 1
fi

echo "=========================================="
echo "  Course Platform 서버 초기 설정"
echo "=========================================="
echo ""
log_info "이 스크립트는 Ubuntu 서버에 필요한 모든 소프트웨어를 설치합니다."
echo ""

# 1. 시스템 업데이트
log_info "시스템 업데이트 중..."
apt update && apt upgrade -y
log_success "시스템 업데이트 완료"

# 2. 필수 도구 설치
log_info "필수 도구 설치 중..."
apt install -y curl wget git build-essential libssl-dev software-properties-common
log_success "필수 도구 설치 완료"

# 3. Python 3.11 설치
log_info "Python 3.11 설치 중..."
add-apt-repository -y ppa:deadsnakes/ppa
apt update
apt install -y python3.11 python3.11-venv python3.11-dev
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
log_success "Python 3.11 설치 완료"

# 4. Node.js 20.x 설치
log_info "Node.js 20.x 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
log_success "Node.js 20.x 설치 완료"

# 5. Redis 설치
log_info "Redis 설치 중..."
apt install -y redis-server
sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
systemctl start redis-server
systemctl enable redis-server
log_success "Redis 설치 완료"

# 6. PostgreSQL 설치
log_info "PostgreSQL 설치 중..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
log_success "PostgreSQL 설치 완료"

# 7. Nginx 설치
log_info "Nginx 설치 중..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
log_success "Nginx 설치 완료"

# 8. MinIO 설치
log_info "MinIO 설치 중..."
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
chmod +x /usr/local/bin/minio

useradd -r minio-user -s /sbin/nologin || true
mkdir -p /mnt/minio/data
chown -R minio-user:minio-user /mnt/minio

MINIO_PASSWORD=$(openssl rand -base64 32)
cat > /etc/default/minio <<EOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_VOLUMES="/mnt/minio/data"
MINIO_OPTS="--console-address :9001"
EOF
chmod 640 /etc/default/minio

log_success "MinIO 설치 완료"
log_info "MinIO 비밀번호: $MINIO_PASSWORD"
echo "$MINIO_PASSWORD" > /root/minio-password.txt
chmod 600 /root/minio-password.txt
log_info "비밀번호가 /root/minio-password.txt에 저장되었습니다."

# 9. Certbot 설치 (Let's Encrypt)
log_info "Certbot 설치 중..."
apt install -y certbot python3-certbot-nginx
log_success "Certbot 설치 완료"

# 10. 방화벽 설정
log_info "방화벽 설정 중..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log_success "방화벽 설정 완료"

# 11. PostgreSQL 데이터베이스 생성
log_info "PostgreSQL 데이터베이스 생성 중..."
DB_PASSWORD=$(openssl rand -base64 32)

sudo -u postgres psql <<EOF
CREATE DATABASE courseplatform;
CREATE USER courseuser WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE courseplatform TO courseuser;
\c courseplatform
GRANT ALL ON SCHEMA public TO courseuser;
EOF

echo "$DB_PASSWORD" > /root/postgres-password.txt
chmod 600 /root/postgres-password.txt
log_success "PostgreSQL 데이터베이스 생성 완료"
log_info "데이터베이스 비밀번호: $DB_PASSWORD"
log_info "비밀번호가 /root/postgres-password.txt에 저장되었습니다."

# 12. 프로젝트 디렉토리 생성
log_info "프로젝트 디렉토리 생성 중..."
mkdir -p /var/www
cd /var/www

# Git 저장소 URL 입력 받기
echo ""
read -p "Git 저장소 URL을 입력하세요 (예: https://github.com/user/repo.git): " GIT_REPO

if [ -z "$GIT_REPO" ]; then
    log_error "Git 저장소 URL이 입력되지 않았습니다."
    exit 1
fi

git clone "$GIT_REPO" claude-code-playground
cd claude-code-playground

# 13. systemd 서비스 파일 복사
log_info "systemd 서비스 파일 설정 중..."
cp deployment/courseplatform-backend.service /etc/systemd/system/
cp deployment/minio.service /etc/systemd/system/
systemctl daemon-reload
log_success "systemd 서비스 파일 설정 완료"

# 14. Nginx 설정 복사
log_info "Nginx 설정 중..."
cp deployment/nginx-courseplatform.conf /etc/nginx/sites-available/courseplatform
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/courseplatform /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
log_success "Nginx 설정 완료"

# 15. 백엔드 설정
log_info "백엔드 가상환경 생성 중..."
cd /var/www/claude-code-playground/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
log_success "백엔드 가상환경 생성 완료"

# .env 파일 생성
log_info ".env 파일 생성 중..."
cp .env.example .env
SECRET_KEY=$(openssl rand -hex 32)

sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql+asyncpg://courseuser:$DB_PASSWORD@localhost:5432/courseplatform|" .env
sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
sed -i "s|DEBUG=True|DEBUG=False|" .env
sed -i "s|ENVIRONMENT=development|ENVIRONMENT=production|" .env
sed -i "s|MINIO_SECRET_KEY=.*|MINIO_SECRET_KEY=$MINIO_PASSWORD|" .env

log_success ".env 파일 생성 완료"

# 16. 파일 권한 설정
log_info "파일 권한 설정 중..."
chown -R www-data:www-data /var/www/claude-code-playground
chmod 600 /var/www/claude-code-playground/backend/.env
log_success "파일 권한 설정 완료"

# 17. 서비스 시작
log_info "서비스 시작 중..."
systemctl start minio
systemctl enable minio
systemctl start courseplatform-backend
systemctl enable courseplatform-backend
log_success "서비스 시작 완료"

# 18. 완료 메시지
echo ""
echo "=========================================="
log_success "서버 초기 설정이 완료되었습니다!"
echo "=========================================="
echo ""
echo "중요 정보:"
echo "  - PostgreSQL 비밀번호: /root/postgres-password.txt"
echo "  - MinIO 비밀번호: /root/minio-password.txt"
echo "  - 백엔드 SECRET_KEY: $SECRET_KEY"
echo ""
echo "다음 단계:"
echo "  1. /var/www/claude-code-playground/backend/.env 파일을 편집하여 Supabase 설정 추가"
echo "  2. /etc/nginx/sites-available/courseplatform 파일에서 도메인 변경"
echo "  3. 프론트엔드 빌드: cd /var/www/claude-code-playground/frontend && npm install --legacy-peer-deps && npm run build"
echo "  4. 데이터베이스 마이그레이션: cd /var/www/claude-code-playground/backend && source venv/bin/activate && alembic upgrade head"
echo "  5. MinIO 콘솔 접속 (http://서버IP:9001) 후 버킷 'course-files' 생성"
echo "  6. Let's Encrypt SSL 인증서 발급: sudo certbot --nginx -d yourdomain.com"
echo "  7. 서비스 재시작: sudo systemctl restart courseplatform-backend nginx"
echo ""
echo "배포 스크립트 사용:"
echo "  /var/www/claude-code-playground/deployment/deploy.sh"
echo ""

exit 0
