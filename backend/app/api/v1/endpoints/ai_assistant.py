"""
AI Assistant API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta
import time

from ....db.base import get_db
from ....api.deps import get_current_user
from ....models.ai_assistant import (
    AIConversation,
    AIMessage,
    AICodeReview,
    AIQuizGeneration,
    AIUsageLog,
    AIProvider as AIProviderEnum,
    AITaskType
)
from ....schemas.ai_assistant import (
    ChatRequest,
    ChatResponse,
    CodeReviewRequest,
    CodeReviewResponse,
    CodeReviewFeedback,
    ExplainConceptRequest,
    ExplainConceptResponse,
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizQuestion,
    SummarizeRequest,
    SummarizeResponse,
    ConversationCreate,
    ConversationResponse,
    ConversationDetail,
    MessageResponse,
    UserUsageStats,
    AIProvidersListResponse,
    AIProviderInfo,
)
from ....services.ai_service import ai_service, Message as AIServiceMessage

router = APIRouter()


# Helper function to log usage
async def log_ai_usage(
    db: AsyncSession,
    user_id: str,
    provider: str,
    model: str,
    task_type: str,
    tokens_used: Optional[int],
    response_time_ms: int,
    course_id: Optional[int] = None,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log AI usage for analytics and billing"""
    usage_log = AIUsageLog(
        user_id=user_id,
        course_id=course_id,
        provider=AIProviderEnum(provider),
        model=model,
        task_type=AITaskType(task_type),
        tokens_used=tokens_used,
        response_time_ms=response_time_ms,
        success=success,
        error_message=error_message
    )
    db.add(usage_log)
    await db.commit()


@router.get("/providers", response_model=AIProvidersListResponse)
async def list_providers():
    """List available AI providers and their models"""
    providers = []

    # OpenAI
    if ai_service.api_keys.get("openai"):
        providers.append(AIProviderInfo(
            provider="openai",
            models=["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
            is_available=True,
            description="OpenAI GPT models - Fast and reliable"
        ))

    # Claude
    if ai_service.api_keys.get("claude"):
        providers.append(AIProviderInfo(
            provider="claude",
            models=[
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku-20241022",
                "claude-3-opus-20240229"
            ],
            is_available=True,
            description="Anthropic Claude - Excellent for complex reasoning"
        ))

    # Gemini
    if ai_service.api_keys.get("gemini"):
        providers.append(AIProviderInfo(
            provider="gemini",
            models=["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
            is_available=True,
            description="Google Gemini - Great for multimodal tasks"
        ))

    # OpenRouter
    if ai_service.api_keys.get("openrouter"):
        providers.append(AIProviderInfo(
            provider="openrouter",
            models=[
                "anthropic/claude-3.5-sonnet",
                "openai/gpt-4-turbo",
                "google/gemini-pro-1.5",
                "meta-llama/llama-3.1-70b-instruct"
            ],
            is_available=True,
            description="OpenRouter - Access multiple models through one API"
        ))

    return AIProvidersListResponse(
        providers=providers,
        default_provider=ai_service.default_provider
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chat with AI assistant
    """
    start_time = time.time()

    try:
        # Get or create conversation
        if request.conversation_id:
            result = await db.execute(
                select(AIConversation).where(
                    AIConversation.id == request.conversation_id,
                    AIConversation.user_id == current_user["user_id"]
                )
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            conversation = AIConversation(
                user_id=current_user["user_id"],
                course_id=request.course_id,
                task_type=AITaskType.CHAT,
                provider=AIProviderEnum(request.provider or ai_service.default_provider),
                model=request.model or ai_service.DEFAULT_MODELS[request.provider or ai_service.default_provider]
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)

        # Get conversation history
        result = await db.execute(
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation.id)
            .order_by(AIMessage.created_at)
        )
        history = result.scalars().all()

        # Build messages
        messages = [
            AIServiceMessage(role=msg.role, content=msg.content)
            for msg in history
        ]
        messages.append(AIServiceMessage(role="user", content=request.message))

        # Call AI service
        response = await ai_service.chat(
            messages=messages,
            provider=conversation.provider.value,
            model=conversation.model,
            temperature=request.temperature
        )

        # Save messages
        user_message = AIMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )
        db.add(user_message)

        assistant_message = AIMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=response.content,
            tokens_used=response.tokens_used,
            finish_reason=response.finish_reason
        )
        db.add(assistant_message)

        await db.commit()
        await db.refresh(assistant_message)

        # Log usage
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=response.provider,
            model=response.model,
            task_type="chat",
            tokens_used=response.tokens_used,
            response_time_ms=response_time_ms,
            course_id=conversation.course_id
        )

        return ChatResponse(
            conversation_id=conversation.id,
            message=MessageResponse(
                id=assistant_message.id,
                role=assistant_message.role,
                content=assistant_message.content,
                tokens_used=assistant_message.tokens_used,
                created_at=assistant_message.created_at
            ),
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used
        )

    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=request.provider or ai_service.default_provider,
            model=request.model or "unknown",
            task_type="chat",
            tokens_used=None,
            response_time_ms=response_time_ms,
            course_id=request.course_id,
            success=False,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/code-review", response_model=CodeReviewResponse)
async def review_code(
    request: CodeReviewRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI code review
    """
    start_time = time.time()

    try:
        # Call AI service
        response = await ai_service.review_code(
            code=request.code,
            language=request.language,
            context=request.context,
            provider=request.provider
        )

        # Save review
        review = AICodeReview(
            submission_id=request.submission_id,
            user_id=current_user["user_id"],
            provider=AIProviderEnum(response.provider),
            model=response.model,
            code=request.code,
            language=request.language,
            context=request.context,
            review=response.content,
            tokens_used=response.tokens_used
        )
        db.add(review)
        await db.commit()
        await db.refresh(review)

        # Log usage
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=response.provider,
            model=response.model,
            task_type="code_review",
            tokens_used=response.tokens_used,
            response_time_ms=response_time_ms
        )

        return CodeReviewResponse(
            review=response.content,
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used,
            review_id=review.id
        )

    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=request.provider or ai_service.default_provider,
            model=request.model or "unknown",
            task_type="code_review",
            tokens_used=None,
            response_time_ms=response_time_ms,
            success=False,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/code-review/{review_id}/feedback")
async def feedback_code_review(
    review_id: int,
    feedback: CodeReviewFeedback,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback on code review"""
    result = await db.execute(
        select(AICodeReview).where(
            AICodeReview.id == review_id,
            AICodeReview.user_id == current_user["user_id"]
        )
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.was_helpful = feedback.was_helpful
    await db.commit()

    return {"message": "Feedback submitted"}


@router.post("/explain", response_model=ExplainConceptResponse)
async def explain_concept(
    request: ExplainConceptRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI explanation of a concept"""
    start_time = time.time()

    try:
        response = await ai_service.explain_concept(
            concept=request.concept,
            level=request.level,
            context=request.context,
            provider=request.provider
        )

        # Log usage
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=response.provider,
            model=response.model,
            task_type="explain_concept",
            tokens_used=response.tokens_used,
            response_time_ms=response_time_ms
        )

        return ExplainConceptResponse(
            explanation=response.content,
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used
        )

    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=request.provider or ai_service.default_provider,
            model=request.model or "unknown",
            task_type="explain_concept",
            tokens_used=None,
            response_time_ms=response_time_ms,
            success=False,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-quiz", response_model=QuizGenerationResponse)
async def generate_quiz(
    request: QuizGenerationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate quiz questions with AI"""
    start_time = time.time()

    try:
        response = await ai_service.generate_quiz(
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            question_types=request.question_types,
            provider=request.provider
        )

        # Parse JSON response
        import json
        questions_data = json.loads(response.content)
        questions = [QuizQuestion(**q) for q in questions_data.get("questions", [])]

        # Save generation
        generation = AIQuizGeneration(
            course_id=request.course_id,
            created_by=current_user["user_id"],
            provider=AIProviderEnum(response.provider),
            model=response.model,
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            question_types=request.question_types,
            generated_questions=questions_data.get("questions", []),
            tokens_used=response.tokens_used
        )
        db.add(generation)
        await db.commit()
        await db.refresh(generation)

        # Log usage
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=response.provider,
            model=response.model,
            task_type="generate_quiz",
            tokens_used=response.tokens_used,
            response_time_ms=response_time_ms,
            course_id=request.course_id
        )

        return QuizGenerationResponse(
            generation_id=generation.id,
            questions=questions,
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used
        )

    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=request.provider or ai_service.default_provider,
            model=request.model or "unknown",
            task_type="generate_quiz",
            tokens_used=None,
            response_time_ms=response_time_ms,
            course_id=request.course_id,
            success=False,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_content(
    request: SummarizeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Summarize content with AI"""
    start_time = time.time()

    try:
        response = await ai_service.summarize_content(
            content=request.content,
            length=request.length,
            provider=request.provider
        )

        # Log usage
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=response.provider,
            model=response.model,
            task_type="summarize",
            tokens_used=response.tokens_used,
            response_time_ms=response_time_ms
        )

        return SummarizeResponse(
            summary=response.content,
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used
        )

    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        await log_ai_usage(
            db=db,
            user_id=current_user["user_id"],
            provider=request.provider or ai_service.default_provider,
            model=request.model or "unknown",
            task_type="summarize",
            tokens_used=None,
            response_time_ms=response_time_ms,
            success=False,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    course_id: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's AI conversations"""
    query = select(AIConversation).where(
        AIConversation.user_id == current_user["user_id"],
        AIConversation.is_archived == False
    )

    if course_id:
        query = query.where(AIConversation.course_id == course_id)

    query = query.order_by(AIConversation.updated_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    conversations = result.scalars().all()

    # Add message count
    response_list = []
    for conv in conversations:
        count_result = await db.execute(
            select(func.count()).where(AIMessage.conversation_id == conv.id)
        )
        message_count = count_result.scalar()

        response_list.append(ConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            course_id=conv.course_id,
            title=conv.title,
            task_type=conv.task_type.value,
            provider=conv.provider.value,
            model=conv.model,
            message_count=message_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        ))

    return response_list


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversation with messages"""
    result = await db.execute(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user["user_id"]
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get messages
    messages_result = await db.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at)
    )
    messages = messages_result.scalars().all()

    return ConversationDetail(
        id=conversation.id,
        user_id=conversation.user_id,
        course_id=conversation.course_id,
        title=conversation.title,
        task_type=conversation.task_type.value,
        provider=conversation.provider.value,
        model=conversation.model,
        message_count=len(messages),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            tokens_used=msg.tokens_used,
            created_at=msg.created_at
        ) for msg in messages]
    )


@router.get("/usage/my-stats", response_model=UserUsageStats)
async def get_my_usage_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's AI usage statistics"""
    period_start = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(AIUsageLog).where(
            AIUsageLog.user_id == current_user["user_id"],
            AIUsageLog.created_at >= period_start
        )
    )
    logs = result.scalars().all()

    total_requests = len(logs)
    total_tokens = sum(log.tokens_used or 0 for log in logs)

    requests_by_provider = {}
    requests_by_task = {}
    response_times = []

    for log in logs:
        # By provider
        provider = log.provider.value
        requests_by_provider[provider] = requests_by_provider.get(provider, 0) + 1

        # By task
        task = log.task_type.value
        requests_by_task[task] = requests_by_task.get(task, 0) + 1

        # Response times
        if log.response_time_ms:
            response_times.append(log.response_time_ms)

    avg_response_time = sum(response_times) / len(response_times) if response_times else None

    return UserUsageStats(
        user_id=current_user["user_id"],
        total_requests=total_requests,
        total_tokens=total_tokens,
        requests_by_provider=requests_by_provider,
        requests_by_task=requests_by_task,
        average_response_time_ms=avg_response_time,
        period_start=period_start,
        period_end=datetime.utcnow()
    )
