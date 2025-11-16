#!/bin/bash

###############################################################################
# Course Platform 배포 스크립트
# Ubuntu 서버에서 프로젝트를 배포하는 자동화 스크립트
###############################################################################

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 배포 디렉토리
DEPLOY_DIR="/var/www/claude-code-playground"

# root 권한 확인
if [[ $EUID -eq 0 ]]; then
   log_error "이 스크립트는 root로 실행하지 마세요. sudo가 필요한 명령어는 자동으로 sudo를 사용합니다."
   exit 1
fi

# 배너 출력
echo "=========================================="
echo "  Course Platform 배포 스크립트"
echo "=========================================="
echo ""

# 1. Git pull
log_info "Git 저장소 업데이트 중..."
cd "$DEPLOY_DIR"
sudo git fetch origin
sudo git pull origin main
log_success "Git 저장소 업데이트 완료"

# 2. 백엔드 업데이트
log_info "백엔드 의존성 설치 중..."
cd "$DEPLOY_DIR/backend"
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
log_success "백엔드 의존성 설치 완료"

# 3. 데이터베이스 마이그레이션
log_info "데이터베이스 마이그레이션 실행 중..."
alembic upgrade head
log_success "데이터베이스 마이그레이션 완료"

# 4. 프론트엔드 빌드
log_info "프론트엔드 의존성 설치 중..."
cd "$DEPLOY_DIR/frontend"
npm install --legacy-peer-deps --silent
log_success "프론트엔드 의존성 설치 완료"

log_info "프론트엔드 빌드 중... (시간이 걸릴 수 있습니다)"
npm run build
log_success "프론트엔드 빌드 완료"

# 5. 파일 권한 설정
log_info "파일 권한 설정 중..."
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"
sudo chmod 600 "$DEPLOY_DIR/backend/.env"
log_success "파일 권한 설정 완료"

# 6. 서비스 재시작
log_info "백엔드 서비스 재시작 중..."
sudo systemctl restart courseplatform-backend
sleep 3

# 백엔드 상태 확인
if sudo systemctl is-active --quiet courseplatform-backend; then
    log_success "백엔드 서비스 정상 실행 중"
else
    log_error "백엔드 서비스 시작 실패"
    sudo journalctl -u courseplatform-backend -n 20 --no-pager
    exit 1
fi

log_info "Nginx 재시작 중..."
sudo nginx -t
sudo systemctl reload nginx
log_success "Nginx 재시작 완료"

# 7. 서비스 상태 확인
echo ""
log_info "서비스 상태 확인 중..."
echo ""

services=("postgresql" "redis-server" "minio" "courseplatform-backend" "nginx")
all_running=true

for service in "${services[@]}"; do
    if sudo systemctl is-active --quiet "$service"; then
        echo -e "  ${GREEN}✓${NC} $service: 실행 중"
    else
        echo -e "  ${RED}✗${NC} $service: 중지됨"
        all_running=false
    fi
done

echo ""

# 8. 헬스 체크
log_info "API 헬스 체크 중..."
sleep 2
response=$(curl -s http://127.0.0.1:8000/health)
if [[ $response == *"healthy"* ]]; then
    log_success "API 헬스 체크 성공: $response"
else
    log_warning "API 헬스 체크 실패: $response"
fi

# 9. 배포 완료
echo ""
echo "=========================================="
if [ "$all_running" = true ]; then
    log_success "배포가 성공적으로 완료되었습니다!"
else
    log_warning "배포가 완료되었지만 일부 서비스가 실행 중이지 않습니다."
fi
echo "=========================================="
echo ""

# 10. 유용한 명령어 안내
echo "유용한 명령어:"
echo "  - 로그 확인: sudo journalctl -u courseplatform-backend -f"
echo "  - 백엔드 재시작: sudo systemctl restart courseplatform-backend"
echo "  - Nginx 재시작: sudo systemctl restart nginx"
echo "  - 전체 상태: sudo systemctl status courseplatform-backend nginx"
echo ""

exit 0
