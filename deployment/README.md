# Deployment Files

이 디렉토리에는 Ubuntu 서버에 Course Platform을 배포하는 데 필요한 모든 파일이 포함되어 있습니다.

## 📁 파일 목록

### 1. `setup-server.sh`
**새로운 Ubuntu 서버 초기 설정 스크립트**

모든 필수 소프트웨어(Python, Node.js, PostgreSQL, Redis, MinIO, Nginx 등)를 자동으로 설치하고 설정합니다.

**사용법:**
```bash
sudo ./setup-server.sh
```

**이 스크립트가 하는 일:**
- 시스템 업데이트
- Python 3.11, Node.js 20.x 설치
- PostgreSQL, Redis, MinIO, Nginx 설치
- 방화벽 설정
- 데이터베이스 및 사용자 생성
- systemd 서비스 파일 설치
- Nginx 설정
- 초기 프로젝트 설정

**실행 후:**
1. Supabase 설정 추가 (`/var/www/claude-code-playground/backend/.env`)
2. 도메인 변경 (`/etc/nginx/sites-available/courseplatform`)
3. 프론트엔드 빌드
4. 데이터베이스 마이그레이션
5. SSL 인증서 발급

---

### 2. `deploy.sh`
**업데이트 배포 스크립트**

서버가 이미 설정된 후, 코드 업데이트를 배포할 때 사용합니다.

**사용법:**
```bash
./deploy.sh
```

**이 스크립트가 하는 일:**
- Git pull
- 백엔드 의존성 업데이트
- 데이터베이스 마이그레이션
- 프론트엔드 빌드
- 서비스 재시작
- 헬스 체크

---

### 3. `courseplatform-backend.service`
**백엔드 systemd 서비스 파일**

백엔드 API를 시스템 서비스로 실행합니다.

**설치 위치:** `/etc/systemd/system/courseplatform-backend.service`

**명령어:**
```bash
# 상태 확인
sudo systemctl status courseplatform-backend

# 시작/중지/재시작
sudo systemctl start courseplatform-backend
sudo systemctl stop courseplatform-backend
sudo systemctl restart courseplatform-backend

# 로그 확인
sudo journalctl -u courseplatform-backend -f
```

---

### 4. `minio.service`
**MinIO systemd 서비스 파일**

MinIO 객체 스토리지를 시스템 서비스로 실행합니다.

**설치 위치:** `/etc/systemd/system/minio.service`

**명령어:**
```bash
# 상태 확인
sudo systemctl status minio

# 시작/중지/재시작
sudo systemctl start minio
sudo systemctl stop minio
sudo systemctl restart minio

# 로그 확인
sudo journalctl -u minio -f
```

---

### 5. `nginx-courseplatform.conf`
**Nginx 설정 파일**

프론트엔드 정적 파일 서빙, API 프록시, WebSocket 프록시 설정이 포함되어 있습니다.

**설치 위치:** `/etc/nginx/sites-available/courseplatform`

**주요 기능:**
- HTTP → HTTPS 리다이렉트
- Rate limiting (API: 10req/s, 일반: 100req/s)
- Gzip 압축
- 정적 파일 캐싱 (1년)
- WebSocket 프록시
- 보안 헤더
- MinIO 콘솔 프록시

**명령어:**
```bash
# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 로그 확인
sudo tail -f /var/log/nginx/courseplatform-access.log
sudo tail -f /var/log/nginx/courseplatform-error.log
```

---

## 🚀 빠른 배포 가이드

### 신규 서버 배포 (처음부터)

1. **Ubuntu 서버 접속**
   ```bash
   ssh user@your-server-ip
   ```

2. **프로젝트 다운로드**
   ```bash
   cd ~
   git clone https://github.com/your-username/claude-code-playground.git
   cd claude-code-playground/deployment
   ```

3. **서버 초기 설정 실행**
   ```bash
   sudo ./setup-server.sh
   ```

   - Git 저장소 URL 입력 시 프롬프트가 나타남
   - 완료 후 PostgreSQL 및 MinIO 비밀번호 확인: `/root/postgres-password.txt`, `/root/minio-password.txt`

4. **환경 변수 설정**
   ```bash
   sudo nano /var/www/claude-code-playground/backend/.env
   ```

   다음 값들을 수정:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_JWT_SECRET`

5. **도메인 설정**
   ```bash
   sudo nano /etc/nginx/sites-available/courseplatform
   ```

   `yourdomain.com`을 실제 도메인으로 변경

6. **프론트엔드 환경 변수 설정**
   ```bash
   sudo nano /var/www/claude-code-playground/frontend/.env.production
   ```

7. **프론트엔드 빌드**
   ```bash
   cd /var/www/claude-code-playground/frontend
   sudo npm install --legacy-peer-deps
   sudo npm run build
   ```

8. **데이터베이스 마이그레이션**
   ```bash
   cd /var/www/claude-code-playground/backend
   source venv/bin/activate
   alembic upgrade head
   ```

9. **MinIO 버킷 생성**
   - 브라우저에서 `http://your-server-ip:9001` 접속
   - `/root/minio-password.txt`의 비밀번호로 로그인
   - `course-files` 버킷 생성

10. **서비스 재시작**
    ```bash
    sudo systemctl restart courseplatform-backend nginx
    ```

11. **SSL 인증서 발급 (Let's Encrypt)**
    ```bash
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
    ```

12. **완료!**
    브라우저에서 `https://yourdomain.com` 접속

---

### 기존 서버 업데이트

```bash
cd /var/www/claude-code-playground
./deployment/deploy.sh
```

이 스크립트는 자동으로:
- 최신 코드 pull
- 의존성 업데이트
- 데이터베이스 마이그레이션
- 프론트엔드 빌드
- 서비스 재시작

---

## 🔧 문제 해결

### 백엔드가 시작되지 않을 때
```bash
# 로그 확인
sudo journalctl -u courseplatform-backend -n 50 --no-pager

# 수동 실행으로 에러 확인
cd /var/www/claude-code-playground/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Nginx 502 에러
```bash
# 백엔드 상태 확인
sudo systemctl status courseplatform-backend

# 백엔드 포트 확인
curl http://127.0.0.1:8000/health

# Nginx 에러 로그
sudo tail -f /var/log/nginx/courseplatform-error.log
```

### MinIO 연결 실패
```bash
# MinIO 상태 확인
sudo systemctl status minio

# MinIO 로그
sudo journalctl -u minio -f

# 버킷 확인
# http://서버IP:9001 접속
```

---

## 📞 지원

문제가 발생하면:
1. 로그 확인: `sudo journalctl -u courseplatform-backend -f`
2. [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) 참조
3. [문제 해결 섹션](../DEPLOYMENT_GUIDE.md#문제-해결) 확인

---

## 🔒 보안 체크리스트

배포 전 확인:
- [ ] `.env` 파일의 `SECRET_KEY` 변경
- [ ] `.env` 파일의 `DEBUG=False` 설정
- [ ] PostgreSQL 비밀번호 변경
- [ ] MinIO 비밀번호 변경
- [ ] Supabase credentials 설정
- [ ] `CORS_ORIGINS`에 실제 도메인만 포함
- [ ] 방화벽 활성화
- [ ] SSL/HTTPS 설정
- [ ] 파일 권한 확인 (`.env` 파일은 600)

---

**작성일:** 2025-11-14
**버전:** 1.0.0
