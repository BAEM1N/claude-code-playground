"""
AI Service Layer - Multi-provider support
Supports: OpenAI, Anthropic (Claude), Google (Gemini), OpenRouter
"""
import os
from typing import Optional, List, Dict, Any, Literal
from abc import ABC, abstractmethod
import httpx
from pydantic import BaseModel


# Type definitions
AIProvider = Literal["openai", "claude", "gemini", "openrouter"]


class Message(BaseModel):
    """Chat message"""
    role: Literal["system", "user", "assistant"]
    content: str


class AIResponse(BaseModel):
    """Standard AI response"""
    content: str
    provider: AIProvider
    model: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None


class AIProviderBase(ABC):
    """Base class for AI providers"""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def chat(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> AIResponse:
        """Send chat completion request"""
        pass


class OpenAIProvider(AIProviderBase):
    """OpenAI GPT provider"""

    BASE_URL = "https://api.openai.com/v1/chat/completions"

    async def chat(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> AIResponse:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.BASE_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [msg.dict() for msg in messages],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    **kwargs
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()

            return AIResponse(
                content=data["choices"][0]["message"]["content"],
                provider="openai",
                model=self.model,
                tokens_used=data.get("usage", {}).get("total_tokens"),
                finish_reason=data["choices"][0].get("finish_reason")
            )


class ClaudeProvider(AIProviderBase):
    """Anthropic Claude provider"""

    BASE_URL = "https://api.anthropic.com/v1/messages"

    async def chat(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> AIResponse:
        # Extract system message if present
        system_message = None
        user_messages = []

        for msg in messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                user_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        async with httpx.AsyncClient() as client:
            payload = {
                "model": self.model,
                "messages": user_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                **kwargs
            }

            if system_message:
                payload["system"] = system_message

            response = await client.post(
                self.BASE_URL,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()

            return AIResponse(
                content=data["content"][0]["text"],
                provider="claude",
                model=self.model,
                tokens_used=data.get("usage", {}).get("input_tokens", 0) +
                           data.get("usage", {}).get("output_tokens", 0),
                finish_reason=data.get("stop_reason")
            )


class GeminiProvider(AIProviderBase):
    """Google Gemini provider"""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    async def chat(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> AIResponse:
        # Convert messages to Gemini format
        contents = []
        system_instruction = None

        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
            else:
                contents.append({
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [{"text": msg.content}]
                })

        async with httpx.AsyncClient() as client:
            url = f"{self.BASE_URL}/{self.model}:generateContent"

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                }
            }

            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            response = await client.post(
                url,
                params={"key": self.api_key},
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()

            return AIResponse(
                content=data["candidates"][0]["content"]["parts"][0]["text"],
                provider="gemini",
                model=self.model,
                tokens_used=data.get("usageMetadata", {}).get("totalTokenCount"),
                finish_reason=data["candidates"][0].get("finishReason")
            )


class OpenRouterProvider(AIProviderBase):
    """OpenRouter provider (supports multiple models)"""

    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    async def chat(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> AIResponse:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.BASE_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
                    "X-Title": "Course Management Platform",
                },
                json={
                    "model": self.model,
                    "messages": [msg.dict() for msg in messages],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    **kwargs
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()

            return AIResponse(
                content=data["choices"][0]["message"]["content"],
                provider="openrouter",
                model=self.model,
                tokens_used=data.get("usage", {}).get("total_tokens"),
                finish_reason=data["choices"][0].get("finish_reason")
            )


class AIService:
    """
    Main AI Service - manages multiple providers
    """

    # Default models for each provider
    DEFAULT_MODELS = {
        "openai": "gpt-4o-mini",
        "claude": "claude-3-5-sonnet-20241022",
        "gemini": "gemini-1.5-flash",
        "openrouter": "anthropic/claude-3.5-sonnet",
    }

    def __init__(self):
        # Load API keys from environment
        self.api_keys = {
            "openai": os.getenv("OPENAI_API_KEY"),
            "claude": os.getenv("ANTHROPIC_API_KEY"),
            "gemini": os.getenv("GOOGLE_API_KEY"),
            "openrouter": os.getenv("OPENROUTER_API_KEY"),
        }

        # Default provider
        self.default_provider = os.getenv("DEFAULT_AI_PROVIDER", "openai")

    def _get_provider(
        self,
        provider: AIProvider,
        model: Optional[str] = None
    ) -> AIProviderBase:
        """Get provider instance"""
        api_key = self.api_keys.get(provider)
        if not api_key:
            raise ValueError(f"API key not found for provider: {provider}")

        model = model or self.DEFAULT_MODELS[provider]

        providers = {
            "openai": OpenAIProvider,
            "claude": ClaudeProvider,
            "gemini": GeminiProvider,
            "openrouter": OpenRouterProvider,
        }

        return providers[provider](api_key=api_key, model=model)

    async def chat(
        self,
        messages: List[Message],
        provider: Optional[AIProvider] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> AIResponse:
        """
        Send chat completion request

        Args:
            messages: List of chat messages
            provider: AI provider to use (default: from env)
            model: Model to use (default: provider default)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate

        Returns:
            AIResponse with generated content
        """
        provider = provider or self.default_provider
        provider_instance = self._get_provider(provider, model)
        return await provider_instance.chat(messages, temperature, max_tokens, **kwargs)

    async def review_code(
        self,
        code: str,
        language: str = "python",
        context: Optional[str] = None,
        provider: Optional[AIProvider] = None,
    ) -> AIResponse:
        """
        Review code and provide feedback

        Args:
            code: Code to review
            language: Programming language
            context: Additional context (assignment description, etc.)
            provider: AI provider to use

        Returns:
            Code review feedback
        """
        system_prompt = f"""You are an expert {language} code reviewer and educator.
Review the following code and provide constructive feedback covering:
1. Correctness and bugs
2. Code quality and best practices
3. Performance considerations
4. Suggestions for improvement

Be encouraging but thorough. Explain concepts clearly for students."""

        user_prompt = f"Language: {language}\n\n"
        if context:
            user_prompt += f"Context: {context}\n\n"
        user_prompt += f"Code:\n```{language}\n{code}\n```"

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ]

        return await self.chat(messages, provider=provider, temperature=0.3)

    async def explain_concept(
        self,
        concept: str,
        level: str = "beginner",
        context: Optional[str] = None,
        provider: Optional[AIProvider] = None,
    ) -> AIResponse:
        """
        Explain a programming concept

        Args:
            concept: Concept to explain
            level: Difficulty level (beginner/intermediate/advanced)
            context: Additional context
            provider: AI provider to use

        Returns:
            Explanation
        """
        system_prompt = f"""You are a patient and clear programming educator.
Explain concepts at a {level} level with:
- Clear definitions
- Practical examples
- Common use cases
- Common pitfalls to avoid"""

        user_prompt = f"Please explain: {concept}"
        if context:
            user_prompt += f"\n\nContext: {context}"

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ]

        return await self.chat(messages, provider=provider, temperature=0.7)

    async def generate_quiz(
        self,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        question_types: List[str] = ["multiple_choice", "short_answer"],
        provider: Optional[AIProvider] = None,
    ) -> AIResponse:
        """
        Generate quiz questions

        Args:
            topic: Topic for quiz
            num_questions: Number of questions
            difficulty: Difficulty level
            question_types: Types of questions to generate
            provider: AI provider to use

        Returns:
            Quiz questions in JSON format
        """
        system_prompt = """You are an expert educator creating assessment questions.
Generate quiz questions in the following JSON format:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    },
    {
      "type": "short_answer",
      "question": "Question text",
      "sample_answer": "Expected answer",
      "key_points": ["point1", "point2"]
    }
  ]
}"""

        user_prompt = f"""Generate {num_questions} {difficulty} difficulty quiz questions about: {topic}

Question types to use: {', '.join(question_types)}

Requirements:
- Mix question types
- Clear and unambiguous
- Include explanations
- Appropriate for {difficulty} level"""

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ]

        return await self.chat(messages, provider=provider, temperature=0.8)

    async def summarize_content(
        self,
        content: str,
        length: str = "medium",
        provider: Optional[AIProvider] = None,
    ) -> AIResponse:
        """
        Summarize learning content

        Args:
            content: Content to summarize
            length: Summary length (short/medium/long)
            provider: AI provider to use

        Returns:
            Summary
        """
        length_guides = {
            "short": "2-3 sentences",
            "medium": "1-2 paragraphs",
            "long": "3-5 paragraphs with key points"
        }

        system_prompt = f"""Summarize the following content in {length_guides[length]}.
Focus on:
- Main ideas and key concepts
- Important details
- Practical takeaways"""

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=content)
        ]

        return await self.chat(messages, provider=provider, temperature=0.5)

    async def answer_question(
        self,
        question: str,
        context: Optional[str] = None,
        chat_history: Optional[List[Message]] = None,
        provider: Optional[AIProvider] = None,
    ) -> AIResponse:
        """
        Answer student question with context

        Args:
            question: Student's question
            context: Course context, materials, etc.
            chat_history: Previous conversation
            provider: AI provider to use

        Returns:
            Answer
        """
        system_prompt = """You are a knowledgeable and patient teaching assistant.
Answer student questions by:
- Providing clear, accurate explanations
- Using examples when helpful
- Encouraging further learning
- Admitting when you're not sure

If the question is unclear, ask for clarification."""

        messages = [Message(role="system", content=system_prompt)]

        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history)

        # Add context as a user message if provided
        if context:
            messages.append(
                Message(role="user", content=f"Context:\n{context}")
            )

        # Add the actual question
        messages.append(Message(role="user", content=question))

        return await self.chat(messages, provider=provider, temperature=0.7)


# Singleton instance
ai_service = AIService()
