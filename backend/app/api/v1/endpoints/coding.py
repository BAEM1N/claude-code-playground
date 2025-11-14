"""
Coding Environment API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from ....db.base import get_db
from ....api.deps import get_current_user
from ....models.coding import (
    CodingProblem,
    TestCase,
    CodeSubmission,
    CodeExecution,
    SavedCode,
    SubmissionStatus,
)
from ....models.user import User
from ....schemas.coding import (
    CodingProblemCreate,
    CodingProblemUpdate,
    CodingProblemResponse,
    CodingProblemDetail,
    TestCaseCreate,
    TestCaseResponse,
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeSubmissionRequest,
    CodeSubmissionResponse,
    CodeSubmissionDetail,
    SavedCodeCreate,
    SavedCodeUpdate,
    SavedCodeResponse,
    UserCodingStatistics,
)
from ....services.code_executor import code_executor

router = APIRouter()


# ===== Code Execution (Playground) =====

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(
    request: CodeExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute code in playground mode (no test cases)"""

    # Execute code
    result = code_executor.execute_code(
        code=request.code,
        language=request.language,
        input_data=request.input_data,
    )

    # Save execution record
    execution = CodeExecution(
        user_id=current_user.id,
        code=request.code,
        language=request.language,
        input_data=request.input_data,
        output=result.get("output"),
        error=result.get("error"),
        execution_time=result.get("execution_time"),
        memory_used=result.get("memory_used"),
        status=result["status"],
    )

    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    return execution


# ===== Coding Problems =====

@router.get("/problems", response_model=List[CodingProblemResponse])
async def get_problems(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    course_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    language: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    """Get all coding problems"""
    query = select(CodingProblem).where(CodingProblem.is_public == True)

    if course_id:
        query = query.where(CodingProblem.course_id == course_id)
    if difficulty:
        query = query.where(CodingProblem.difficulty == difficulty)
    if language:
        query = query.where(CodingProblem.language == language)

    query = query.offset(skip).limit(limit).order_by(CodingProblem.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/problems/{problem_id}", response_model=CodingProblemDetail)
async def get_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a coding problem with test cases"""
    result = await db.execute(
        select(CodingProblem).where(CodingProblem.id == problem_id)
    )
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Get test cases (only sample cases for students)
    test_cases_result = await db.execute(
        select(TestCase)
        .where(TestCase.problem_id == problem_id)
        .where(TestCase.is_sample == True)
        .order_by(TestCase.order_index)
    )
    sample_test_cases = test_cases_result.scalars().all()

    # Get all test cases for instructors
    if current_user.role == "instructor":
        all_test_cases_result = await db.execute(
            select(TestCase)
            .where(TestCase.problem_id == problem_id)
            .order_by(TestCase.order_index)
        )
        test_cases = all_test_cases_result.scalars().all()
    else:
        test_cases = sample_test_cases

    # Get total submissions count
    submissions_count_result = await db.execute(
        select(func.count(CodeSubmission.id))
        .where(CodeSubmission.problem_id == problem_id)
    )
    total_submissions = submissions_count_result.scalar() or 0

    # Get user's best submission
    user_best_result = await db.execute(
        select(CodeSubmission)
        .where(CodeSubmission.problem_id == problem_id)
        .where(CodeSubmission.user_id == current_user.id)
        .where(CodeSubmission.status == SubmissionStatus.PASSED)
        .order_by(CodeSubmission.score.desc(), CodeSubmission.execution_time.asc())
        .limit(1)
    )
    user_best_submission = user_best_result.scalar_one_or_none()

    return CodingProblemDetail(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        language=problem.language,
        starter_code=problem.starter_code,
        time_limit=problem.time_limit,
        memory_limit=problem.memory_limit,
        tags=problem.tags,
        hints=problem.hints,
        is_public=problem.is_public,
        course_id=problem.course_id,
        assignment_id=problem.assignment_id,
        created_by_id=problem.created_by_id,
        created_at=problem.created_at,
        updated_at=problem.updated_at,
        test_cases=test_cases,
        sample_test_cases=sample_test_cases,
        total_submissions=total_submissions,
        user_best_submission=user_best_submission,
    )


@router.post("/problems", response_model=CodingProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(
    problem_data: CodingProblemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new coding problem (instructor only)"""
    if current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can create problems")

    # Create problem
    new_problem = CodingProblem(
        title=problem_data.title,
        description=problem_data.description,
        difficulty=problem_data.difficulty,
        language=problem_data.language,
        starter_code=problem_data.starter_code or code_executor.get_starter_code(problem_data.language),
        solution_code=problem_data.solution_code,
        time_limit=problem_data.time_limit,
        memory_limit=problem_data.memory_limit,
        tags=problem_data.tags,
        hints=problem_data.hints,
        is_public=problem_data.is_public,
        course_id=problem_data.course_id,
        assignment_id=problem_data.assignment_id,
        created_by_id=current_user.id,
    )

    db.add(new_problem)
    await db.flush()

    # Add test cases
    if problem_data.test_cases:
        for tc_data in problem_data.test_cases:
            test_case = TestCase(
                problem_id=new_problem.id,
                input_data=tc_data.input_data,
                expected_output=tc_data.expected_output,
                is_sample=tc_data.is_sample,
                is_hidden=tc_data.is_hidden,
                points=tc_data.points,
                order_index=tc_data.order_index,
                description=tc_data.description,
            )
            db.add(test_case)

    await db.commit()
    await db.refresh(new_problem)

    return new_problem


# ===== Code Submissions =====

@router.post("/submit", response_model=CodeSubmissionDetail)
async def submit_code(
    request: CodeSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit code for a problem"""

    # Get problem and test cases
    problem_result = await db.execute(
        select(CodingProblem).where(CodingProblem.id == request.problem_id)
    )
    problem = problem_result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases_result = await db.execute(
        select(TestCase)
        .where(TestCase.problem_id == request.problem_id)
        .order_by(TestCase.order_index)
    )
    test_cases = test_cases_result.scalars().all()

    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases found for this problem")

    # Run code against test cases
    test_case_dicts = [
        {
            "id": tc.id,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_sample": tc.is_sample,
            "is_hidden": tc.is_hidden,
            "points": tc.points,
        }
        for tc in test_cases
    ]

    execution_result = code_executor.run_test_cases(
        code=request.code,
        language=request.language,
        test_cases=test_case_dicts,
        time_limit=problem.time_limit,
        memory_limit=problem.memory_limit,
    )

    # Create submission record
    submission = CodeSubmission(
        problem_id=request.problem_id,
        user_id=current_user.id,
        code=request.code,
        language=request.language,
        status=execution_result["status"],
        score=execution_result["score"],
        total_test_cases=execution_result["total_test_cases"],
        passed_test_cases=execution_result["passed_test_cases"],
        execution_time=execution_result["execution_time"],
        test_results=execution_result["test_results"],
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return CodeSubmissionDetail(
        id=submission.id,
        problem_id=submission.problem_id,
        user_id=submission.user_id,
        code=submission.code,
        language=submission.language,
        status=submission.status,
        score=submission.score,
        total_test_cases=submission.total_test_cases,
        passed_test_cases=submission.passed_test_cases,
        execution_time=submission.execution_time,
        memory_used=submission.memory_used,
        error_message=submission.error_message,
        output=submission.output,
        test_results=submission.test_results,
        submitted_at=submission.submitted_at,
        test_case_results=execution_result["test_results"],
    )


@router.get("/submissions/my", response_model=List[CodeSubmissionResponse])
async def get_my_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    problem_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get user's submissions"""
    query = select(CodeSubmission).where(CodeSubmission.user_id == current_user.id)

    if problem_id:
        query = query.where(CodeSubmission.problem_id == problem_id)

    query = query.offset(skip).limit(limit).order_by(CodeSubmission.submitted_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


# ===== Saved Code =====

@router.get("/saved", response_model=List[SavedCodeResponse])
async def get_saved_codes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's saved code snippets"""
    result = await db.execute(
        select(SavedCode)
        .where(SavedCode.user_id == current_user.id)
        .order_by(SavedCode.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/saved", response_model=SavedCodeResponse, status_code=status.HTTP_201_CREATED)
async def save_code(
    code_data: SavedCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a code snippet"""
    saved_code = SavedCode(
        user_id=current_user.id,
        problem_id=code_data.problem_id,
        title=code_data.title,
        code=code_data.code,
        language=code_data.language,
        is_favorite=code_data.is_favorite,
        notes=code_data.notes,
    )

    db.add(saved_code)
    await db.commit()
    await db.refresh(saved_code)

    return saved_code


@router.delete("/saved/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_code(
    code_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a saved code snippet"""
    result = await db.execute(
        select(SavedCode)
        .where(SavedCode.id == code_id)
        .where(SavedCode.user_id == current_user.id)
    )
    saved_code = result.scalar_one_or_none()

    if not saved_code:
        raise HTTPException(status_code=404, detail="Saved code not found")

    await db.delete(saved_code)
    await db.commit()


# ===== Statistics =====

@router.get("/stats/my", response_model=UserCodingStatistics)
async def get_my_coding_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's coding statistics"""

    # Total submissions
    total_result = await db.execute(
        select(func.count(CodeSubmission.id))
        .where(CodeSubmission.user_id == current_user.id)
    )
    total_submissions = total_result.scalar() or 0

    # Problems solved (unique problems with at least one passed submission)
    solved_result = await db.execute(
        select(func.count(func.distinct(CodeSubmission.problem_id)))
        .where(CodeSubmission.user_id == current_user.id)
        .where(CodeSubmission.status == SubmissionStatus.PASSED)
    )
    problems_solved = solved_result.scalar() or 0

    # Problems attempted
    attempted_result = await db.execute(
        select(func.count(func.distinct(CodeSubmission.problem_id)))
        .where(CodeSubmission.user_id == current_user.id)
    )
    problems_attempted = attempted_result.scalar() or 0

    # Total execution time
    time_result = await db.execute(
        select(func.sum(CodeSubmission.execution_time))
        .where(CodeSubmission.user_id == current_user.id)
    )
    total_execution_time = time_result.scalar() or 0.0

    # Recent submissions
    recent_result = await db.execute(
        select(CodeSubmission)
        .where(CodeSubmission.user_id == current_user.id)
        .order_by(CodeSubmission.submitted_at.desc())
        .limit(10)
    )
    recent_submissions = recent_result.scalars().all()

    return UserCodingStatistics(
        total_submissions=total_submissions,
        problems_solved=problems_solved,
        problems_attempted=problems_attempted,
        total_execution_time=round(total_execution_time, 2),
        favorite_language=None,  # Could calculate from submissions
        difficulty_breakdown={},  # Could calculate from solved problems
        recent_submissions=recent_submissions,
    )
