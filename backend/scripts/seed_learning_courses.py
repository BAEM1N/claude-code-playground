"""
Seed Data Science & Machine Learning Learning Courses
Python, Numpy, Pandas, Matplotlib, Seaborn, Scikit-Learn, PyTorch 과정 생성
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.learning import (
    LearningTrack,
    LearningModule,
    LearningChapter,
    LearningTopic,
    ContentType,
    VideoSource,
)
from uuid import uuid4


async def create_learning_courses(db: AsyncSession, user_id: str):
    """Create comprehensive Data Science & ML learning track"""

    # ==================== TRACK ====================
    track = LearningTrack(
        id=uuid4(),
        title="데이터 사이언스 & 머신러닝 마스터 트랙",
        description="Python 기초부터 PyTorch 딥러닝까지, 완전한 데이터 사이언스 학습 경로",
        thumbnail_url="/images/tracks/data-science-master.png",
        order=1,
        is_published=True,
        created_by=user_id
    )
    db.add(track)
    await db.flush()

    print(f"✅ Track created: {track.title}")

    # ==================== MODULES ====================
    modules_data = [
        {
            "title": "Python 기초",
            "description": "Python 프로그래밍의 기본부터 고급 개념까지",
            "estimated_hours": 20,
            "difficulty_level": "beginner",
            "order": 1,
        },
        {
            "title": "Numpy 마스터",
            "description": "수치 연산과 배열 처리의 기초, Numpy 완전 정복",
            "estimated_hours": 15,
            "difficulty_level": "beginner",
            "order": 2,
        },
        {
            "title": "Pandas 데이터 분석",
            "description": "데이터 조작과 분석을 위한 Pandas 라이브러리",
            "estimated_hours": 25,
            "difficulty_level": "intermediate",
            "order": 3,
        },
        {
            "title": "Matplotlib 시각화",
            "description": "데이터 시각화의 기초, Matplotlib 완벽 가이드",
            "estimated_hours": 12,
            "difficulty_level": "beginner",
            "order": 4,
        },
        {
            "title": "Seaborn 고급 시각화",
            "description": "통계적 데이터 시각화, Seaborn으로 아름다운 차트 만들기",
            "estimated_hours": 10,
            "difficulty_level": "intermediate",
            "order": 5,
        },
        {
            "title": "Scikit-Learn 머신러닝",
            "description": "전통적 머신러닝 알고리즘과 Scikit-Learn 실습",
            "estimated_hours": 30,
            "difficulty_level": "intermediate",
            "order": 6,
        },
        {
            "title": "PyTorch 딥러닝",
            "description": "딥러닝 프레임워크 PyTorch로 신경망 구축하기",
            "estimated_hours": 40,
            "difficulty_level": "advanced",
            "order": 7,
        },
    ]

    modules = []
    for mod_data in modules_data:
        module = LearningModule(
            id=uuid4(),
            track_id=track.id,
            title=mod_data["title"],
            description=mod_data["description"],
            estimated_hours=mod_data["estimated_hours"],
            difficulty_level=mod_data["difficulty_level"],
            order=mod_data["order"],
            is_published=True,
            created_by=user_id
        )
        db.add(module)
        modules.append(module)

    await db.flush()
    print(f"✅ Created {len(modules)} modules")

    # ==================== CHAPTERS & TOPICS ====================

    # Module 1: Python 기초
    python_chapters = [
        {
            "title": "Python 시작하기",
            "description": "Python 설치와 개발 환경 설정",
            "order": 1,
            "topics": [
                {"title": "Python 소개 및 설치", "type": "video", "duration": 15},
                {"title": "개발 환경 설정 (VSCode, Jupyter)", "type": "video", "duration": 20},
                {"title": "첫 번째 Python 프로그램", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "기본 문법",
            "description": "변수, 자료형, 연산자",
            "order": 2,
            "topics": [
                {"title": "변수와 자료형", "type": "video", "duration": 25},
                {"title": "연산자와 표현식", "type": "markdown", "duration": 20},
                {"title": "실습: 계산기 만들기", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "제어문",
            "description": "조건문과 반복문",
            "order": 3,
            "topics": [
                {"title": "if-elif-else 조건문", "type": "video", "duration": 20},
                {"title": "for와 while 반복문", "type": "video", "duration": 25},
                {"title": "실습: 구구단 프로그램", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "자료구조",
            "description": "리스트, 튜플, 딕셔너리, 집합",
            "order": 4,
            "topics": [
                {"title": "리스트(List) 완벽 가이드", "type": "video", "duration": 30},
                {"title": "튜플(Tuple)과 집합(Set)", "type": "video", "duration": 20},
                {"title": "딕셔너리(Dictionary) 활용", "type": "video", "duration": 25},
                {"title": "실습: 학생 관리 시스템", "type": "notebook", "duration": 45},
            ]
        },
        {
            "title": "함수",
            "description": "함수 정의와 활용",
            "order": 5,
            "topics": [
                {"title": "함수 기초", "type": "video", "duration": 25},
                {"title": "매개변수와 반환값", "type": "markdown", "duration": 20},
                {"title": "람다 함수와 고차 함수", "type": "video", "duration": 30},
                {"title": "실습: 유틸리티 함수 만들기", "type": "notebook", "duration": 40},
            ]
        },
    ]

    # Module 2: Numpy
    numpy_chapters = [
        {
            "title": "Numpy 시작하기",
            "description": "Numpy 설치와 기본 개념",
            "order": 1,
            "topics": [
                {"title": "Numpy란 무엇인가?", "type": "video", "duration": 15},
                {"title": "배열(Array) 생성", "type": "video", "duration": 20},
                {"title": "실습: 첫 번째 Numpy 배열", "type": "notebook", "duration": 25},
            ]
        },
        {
            "title": "배열 연산",
            "description": "배열 연산과 브로드캐스팅",
            "order": 2,
            "topics": [
                {"title": "기본 수학 연산", "type": "video", "duration": 25},
                {"title": "브로드캐스팅 이해하기", "type": "video", "duration": 30},
                {"title": "실습: 행렬 연산", "type": "notebook", "duration": 35},
            ]
        },
        {
            "title": "배열 조작",
            "description": "인덱싱, 슬라이싱, 형태 변경",
            "order": 3,
            "topics": [
                {"title": "인덱싱과 슬라이싱", "type": "video", "duration": 25},
                {"title": "배열 형태 변경 (reshape, transpose)", "type": "video", "duration": 20},
                {"title": "실습: 이미지 데이터 처리", "type": "notebook", "duration": 40},
            ]
        },
        {
            "title": "고급 기능",
            "description": "마스킹, 팬시 인덱싱, 집계 함수",
            "order": 4,
            "topics": [
                {"title": "불리언 마스킹", "type": "video", "duration": 20},
                {"title": "집계 함수 (sum, mean, std)", "type": "markdown", "duration": 15},
                {"title": "실습: 데이터 필터링과 집계", "type": "notebook", "duration": 35},
            ]
        },
    ]

    # Module 3: Pandas
    pandas_chapters = [
        {
            "title": "Pandas 시작하기",
            "description": "Series와 DataFrame 기초",
            "order": 1,
            "topics": [
                {"title": "Pandas 소개", "type": "video", "duration": 15},
                {"title": "Series와 DataFrame", "type": "video", "duration": 25},
                {"title": "데이터 불러오기 (CSV, Excel)", "type": "video", "duration": 20},
                {"title": "실습: 첫 번째 데이터 분석", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "데이터 선택과 필터링",
            "description": "loc, iloc, 조건부 선택",
            "order": 2,
            "topics": [
                {"title": "loc vs iloc", "type": "video", "duration": 25},
                {"title": "조건부 필터링", "type": "video", "duration": 20},
                {"title": "실습: 데이터 탐색", "type": "notebook", "duration": 35},
            ]
        },
        {
            "title": "데이터 정제",
            "description": "결측치 처리, 중복 제거",
            "order": 3,
            "topics": [
                {"title": "결측치(NaN) 처리", "type": "video", "duration": 30},
                {"title": "중복 데이터 제거", "type": "markdown", "duration": 15},
                {"title": "실습: 실전 데이터 클리닝", "type": "notebook", "duration": 40},
            ]
        },
        {
            "title": "데이터 변환",
            "description": "그룹화, 피벗, 병합",
            "order": 4,
            "topics": [
                {"title": "groupby 그룹화", "type": "video", "duration": 30},
                {"title": "피벗 테이블", "type": "video", "duration": 25},
                {"title": "데이터 병합 (merge, concat)", "type": "video", "duration": 30},
                {"title": "실습: 복잡한 데이터 변환", "type": "notebook", "duration": 45},
            ]
        },
        {
            "title": "시계열 데이터",
            "description": "날짜/시간 데이터 처리",
            "order": 5,
            "topics": [
                {"title": "datetime 다루기", "type": "video", "duration": 25},
                {"title": "시계열 리샘플링", "type": "video", "duration": 20},
                {"title": "실습: 주식 데이터 분석", "type": "notebook", "duration": 40},
            ]
        },
    ]

    # Module 4: Matplotlib
    matplotlib_chapters = [
        {
            "title": "Matplotlib 기초",
            "description": "기본 플롯 생성",
            "order": 1,
            "topics": [
                {"title": "Matplotlib 소개", "type": "video", "duration": 15},
                {"title": "선 그래프 그리기", "type": "video", "duration": 20},
                {"title": "실습: 첫 번째 차트", "type": "notebook", "duration": 25},
            ]
        },
        {
            "title": "다양한 차트 유형",
            "description": "막대, 산점도, 히스토그램",
            "order": 2,
            "topics": [
                {"title": "막대 그래프", "type": "video", "duration": 20},
                {"title": "산점도(Scatter Plot)", "type": "video", "duration": 20},
                {"title": "히스토그램과 박스플롯", "type": "video", "duration": 25},
                {"title": "실습: 다양한 차트 그리기", "type": "notebook", "duration": 35},
            ]
        },
        {
            "title": "차트 커스터마이징",
            "description": "스타일, 레이블, 범례",
            "order": 3,
            "topics": [
                {"title": "색상과 스타일", "type": "video", "duration": 20},
                {"title": "축 레이블과 제목", "type": "markdown", "duration": 15},
                {"title": "실습: 전문가 수준 차트", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "서브플롯",
            "description": "여러 차트 배치",
            "order": 4,
            "topics": [
                {"title": "서브플롯 생성", "type": "video", "duration": 25},
                {"title": "실습: 대시보드 만들기", "type": "notebook", "duration": 40},
            ]
        },
    ]

    # Module 5: Seaborn
    seaborn_chapters = [
        {
            "title": "Seaborn 시작하기",
            "description": "Seaborn 기본 개념",
            "order": 1,
            "topics": [
                {"title": "Seaborn vs Matplotlib", "type": "video", "duration": 15},
                {"title": "테마와 스타일", "type": "video", "duration": 20},
                {"title": "실습: 아름다운 차트", "type": "notebook", "duration": 25},
            ]
        },
        {
            "title": "분포 시각화",
            "description": "히스토그램, KDE, 바이올린 플롯",
            "order": 2,
            "topics": [
                {"title": "분포 플롯 (distplot, histplot)", "type": "video", "duration": 25},
                {"title": "박스플롯과 바이올린 플롯", "type": "video", "duration": 20},
                {"title": "실습: 데이터 분포 분석", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "관계 시각화",
            "description": "산점도, 회귀선, 페어플롯",
            "order": 3,
            "topics": [
                {"title": "산점도와 회귀선", "type": "video", "duration": 25},
                {"title": "페어플롯(Pairplot)", "type": "video", "duration": 20},
                {"title": "실습: 상관관계 분석", "type": "notebook", "duration": 35},
            ]
        },
        {
            "title": "범주형 데이터",
            "description": "막대 그래프, 포인트 플롯",
            "order": 4,
            "topics": [
                {"title": "범주형 플롯", "type": "video", "duration": 20},
                {"title": "히트맵", "type": "video", "duration": 25},
                {"title": "실습: 카테고리 데이터 시각화", "type": "notebook", "duration": 30},
            ]
        },
    ]

    # Module 6: Scikit-Learn
    sklearn_chapters = [
        {
            "title": "머신러닝 기초",
            "description": "머신러닝 개념과 Scikit-Learn 소개",
            "order": 1,
            "topics": [
                {"title": "머신러닝이란?", "type": "video", "duration": 20},
                {"title": "지도학습 vs 비지도학습", "type": "video", "duration": 25},
                {"title": "Scikit-Learn 구조", "type": "markdown", "duration": 15},
                {"title": "실습: 첫 번째 ML 모델", "type": "notebook", "duration": 30},
            ]
        },
        {
            "title": "회귀(Regression)",
            "description": "선형 회귀와 다항 회귀",
            "order": 2,
            "topics": [
                {"title": "선형 회귀 이론", "type": "video", "duration": 30},
                {"title": "다항 회귀", "type": "video", "duration": 25},
                {"title": "모델 평가 (MSE, R²)", "type": "markdown", "duration": 20},
                {"title": "실습: 집값 예측", "type": "notebook", "duration": 45},
            ]
        },
        {
            "title": "분류(Classification)",
            "description": "로지스틱 회귀, Decision Tree, Random Forest",
            "order": 3,
            "topics": [
                {"title": "로지스틱 회귀", "type": "video", "duration": 30},
                {"title": "Decision Tree", "type": "video", "duration": 30},
                {"title": "Random Forest", "type": "video", "duration": 35},
                {"title": "모델 평가 (정확도, F1-Score)", "type": "markdown", "duration": 20},
                {"title": "실습: 타이타닉 생존자 예측", "type": "notebook", "duration": 50},
            ]
        },
        {
            "title": "클러스터링",
            "description": "K-Means, DBSCAN",
            "order": 4,
            "topics": [
                {"title": "K-Means 클러스터링", "type": "video", "duration": 30},
                {"title": "DBSCAN", "type": "video", "duration": 25},
                {"title": "실습: 고객 세그먼테이션", "type": "notebook", "duration": 40},
            ]
        },
        {
            "title": "차원 축소",
            "description": "PCA, t-SNE",
            "order": 5,
            "topics": [
                {"title": "PCA (주성분 분석)", "type": "video", "duration": 30},
                {"title": "t-SNE", "type": "video", "duration": 25},
                {"title": "실습: 고차원 데이터 시각화", "type": "notebook", "duration": 35},
            ]
        },
        {
            "title": "모델 최적화",
            "description": "하이퍼파라미터 튜닝, 교차 검증",
            "order": 6,
            "topics": [
                {"title": "교차 검증(Cross-Validation)", "type": "video", "duration": 25},
                {"title": "Grid Search", "type": "video", "duration": 30},
                {"title": "실습: 모델 최적화", "type": "notebook", "duration": 45},
            ]
        },
    ]

    # Module 7: PyTorch
    pytorch_chapters = [
        {
            "title": "PyTorch 시작하기",
            "description": "PyTorch 설치와 기본 개념",
            "order": 1,
            "topics": [
                {"title": "PyTorch 소개", "type": "video", "duration": 20},
                {"title": "텐서(Tensor) 기초", "type": "video", "duration": 30},
                {"title": "자동 미분(Autograd)", "type": "video", "duration": 25},
                {"title": "실습: PyTorch 텐서 연산", "type": "notebook", "duration": 35},
            ]
        },
        {
            "title": "신경망 기초",
            "description": "퍼셉트론과 다층 신경망",
            "order": 2,
            "topics": [
                {"title": "퍼셉트론 이해하기", "type": "video", "duration": 25},
                {"title": "활성화 함수", "type": "video", "duration": 20},
                {"title": "순전파와 역전파", "type": "video", "duration": 30},
                {"title": "실습: 첫 번째 신경망", "type": "notebook", "duration": 40},
            ]
        },
        {
            "title": "PyTorch 모델 구축",
            "description": "nn.Module, Layer, Optimizer",
            "order": 3,
            "topics": [
                {"title": "nn.Module 이해하기", "type": "video", "duration": 30},
                {"title": "손실 함수와 옵티마이저", "type": "video", "duration": 25},
                {"title": "학습 루프 작성", "type": "video", "duration": 30},
                {"title": "실습: MNIST 숫자 분류", "type": "notebook", "duration": 50},
            ]
        },
        {
            "title": "합성곱 신경망(CNN)",
            "description": "이미지 처리를 위한 CNN",
            "order": 4,
            "topics": [
                {"title": "CNN 구조 이해", "type": "video", "duration": 35},
                {"title": "Conv2d, Pooling Layer", "type": "video", "duration": 30},
                {"title": "실습: CIFAR-10 이미지 분류", "type": "notebook", "duration": 60},
            ]
        },
        {
            "title": "순환 신경망(RNN)",
            "description": "시계열과 텍스트 처리",
            "order": 5,
            "topics": [
                {"title": "RNN, LSTM 이해", "type": "video", "duration": 35},
                {"title": "시퀀스 데이터 처리", "type": "video", "duration": 30},
                {"title": "실습: 텍스트 감성 분석", "type": "notebook", "duration": 55},
            ]
        },
        {
            "title": "전이 학습",
            "description": "사전 훈련된 모델 활용",
            "order": 6,
            "topics": [
                {"title": "전이 학습 개념", "type": "video", "duration": 25},
                {"title": "ResNet, VGG 활용", "type": "video", "duration": 30},
                {"title": "실습: 이미지 분류 프로젝트", "type": "notebook", "duration": 50},
            ]
        },
        {
            "title": "PyTorch 고급 기법",
            "description": "DataLoader, GPU 활용, 모델 저장",
            "order": 7,
            "topics": [
                {"title": "Dataset과 DataLoader", "type": "video", "duration": 30},
                {"title": "GPU 활용하기", "type": "video", "duration": 25},
                {"title": "모델 저장과 불러오기", "type": "markdown", "duration": 20},
                {"title": "실습: 종합 프로젝트", "type": "notebook", "duration": 60},
            ]
        },
    ]

    # Create all chapters and topics
    all_chapter_data = [
        (modules[0], python_chapters),      # Python
        (modules[1], numpy_chapters),       # Numpy
        (modules[2], pandas_chapters),      # Pandas
        (modules[3], matplotlib_chapters),  # Matplotlib
        (modules[4], seaborn_chapters),     # Seaborn
        (modules[5], sklearn_chapters),     # Scikit-Learn
        (modules[6], pytorch_chapters),     # PyTorch
    ]

    total_topics = 0
    for module, chapters_data in all_chapter_data:
        for chapter_data in chapters_data:
            chapter = LearningChapter(
                id=uuid4(),
                module_id=module.id,
                title=chapter_data["title"],
                description=chapter_data["description"],
                order=chapter_data["order"],
                is_published=True
            )
            db.add(chapter)
            await db.flush()

            for idx, topic_data in enumerate(chapter_data["topics"], start=1):
                content_type_map = {
                    "video": ContentType.VIDEO,
                    "markdown": ContentType.MARKDOWN,
                    "notebook": ContentType.NOTEBOOK,
                }

                topic = LearningTopic(
                    id=uuid4(),
                    chapter_id=chapter.id,
                    title=topic_data["title"],
                    description=f"{topic_data['title']} 학습",
                    content_type=content_type_map[topic_data["type"]],
                    duration_minutes=topic_data["duration"],
                    order=idx,
                    is_published=True,
                    is_required=True
                )

                # Set content based on type
                if topic_data["type"] == "video":
                    topic.video_source = VideoSource.YOUTUBE
                    topic.video_url = f"https://www.youtube.com/watch?v=example_{uuid4().hex[:8]}"
                    topic.video_duration_seconds = topic_data["duration"] * 60
                elif topic_data["type"] == "markdown":
                    topic.markdown_content = f"# {topic_data['title']}\n\n여기에 학습 내용이 들어갑니다."
                elif topic_data["type"] == "notebook":
                    topic.notebook_data = {
                        "cells": [
                            {
                                "cell_type": "markdown",
                                "metadata": {},
                                "source": [f"# {topic_data['title']}\n\n실습을 시작합니다."]
                            },
                            {
                                "cell_type": "code",
                                "metadata": {},
                                "source": ["# 코드를 작성하세요\n"],
                                "outputs": []
                            }
                        ],
                        "metadata": {
                            "kernelspec": {
                                "display_name": "Python 3",
                                "language": "python",
                                "name": "python3"
                            }
                        },
                        "nbformat": 4,
                        "nbformat_minor": 4
                    }

                db.add(topic)
                total_topics += 1

        print(f"✅ Module '{module.title}': {len(chapters_data)} chapters created")

    await db.commit()
    print(f"\n🎉 Total: {total_topics} topics created across all modules!")


async def main():
    """Main seeding function"""
    print("🌱 Seeding Data Science & ML Learning Courses...")
    print("=" * 60)

    # You need to provide a valid user_id from your database
    # For now, using a placeholder - replace with actual user ID
    user_id = "00000000-0000-0000-0000-000000000000"  # Replace with actual instructor ID

    async with AsyncSessionLocal() as db:
        await create_learning_courses(db, user_id)

    print("=" * 60)
    print("✅ All learning courses seeded successfully!")
    print("\n📚 Created:")
    print("  - 1 Track: 데이터 사이언스 & 머신러닝 마스터 트랙")
    print("  - 7 Modules: Python, Numpy, Pandas, Matplotlib, Seaborn, Scikit-Learn, PyTorch")
    print("  - 30+ Chapters")
    print("  - 150+ Topics (Video, Markdown, Notebook)")


if __name__ == "__main__":
    asyncio.run(main())
