"""
Assignment business logic service.

This service handles complex business logic for assignments, submissions,
and grading to keep endpoint code clean and focused.
"""
from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment, Submission, Grade
from app.models.course import CourseMember, Course
from app.services.notification_service import notification_service


class AssignmentService:
    """Service for assignment-related business logic."""

    @staticmethod
    async def get_assignment_statistics(
        db: AsyncSession,
        assignment_id: UUID
    ) -> Dict:
        """
        Calculate comprehensive assignment statistics.

        Args:
            db: Database session
            assignment_id: Assignment ID

        Returns:
            Dictionary with statistics:
            - total_submissions: int
            - graded_count: int
            - average_score: float
            - highest_score: float
            - lowest_score: float
            - submission_rate: float
            - grading_rate: float

        Example:
            >>> stats = await AssignmentService.get_assignment_statistics(
            ...     db, assignment_id
            ... )
            >>> print(stats['average_score'])
        """
        # Get assignment
        assignment_query = select(Assignment).where(Assignment.id == assignment_id)
        assignment_result = await db.execute(assignment_query)
        assignment = assignment_result.scalar_one_or_none()

        if not assignment:
            return {}

        # Total submissions (including not submitted)
        total_students_query = select(func.count(CourseMember.id)).where(
            CourseMember.course_id == assignment.course_id,
            CourseMember.role == "student"
        )
        total_students_result = await db.execute(total_students_query)
        total_students = total_students_result.scalar()

        # Actual submissions
        submissions_query = select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.submitted_at.isnot(None)
        )
        submissions_result = await db.execute(submissions_query)
        submissions = submissions_result.scalars().all()
        submitted_count = len(submissions)

        # Graded submissions
        graded_query = select(Grade).join(Submission).where(
            Submission.assignment_id == assignment_id
        )
        graded_result = await db.execute(graded_query)
        grades = graded_result.scalars().all()
        graded_count = len(grades)

        # Calculate scores
        scores = [g.points for g in grades] if grades else []
        average_score = sum(scores) / len(scores) if scores else 0
        highest_score = max(scores) if scores else 0
        lowest_score = min(scores) if scores else 0

        # Rates
        submission_rate = (submitted_count / total_students * 100) if total_students > 0 else 0
        grading_rate = (graded_count / submitted_count * 100) if submitted_count > 0 else 0

        return {
            'total_students': total_students,
            'total_submissions': submitted_count,
            'graded_count': graded_count,
            'average_score': round(average_score, 2),
            'highest_score': highest_score,
            'lowest_score': lowest_score,
            'submission_rate': round(submission_rate, 1),
            'grading_rate': round(grading_rate, 1),
            'submissions': submissions  # Include for detailed view
        }

    @staticmethod
    async def notify_students_of_assignment(
        db: AsyncSession,
        assignment: Assignment,
        course_id: UUID
    ) -> int:
        """
        Send notifications to all students about new assignment.

        Args:
            db: Database session
            assignment: Assignment instance
            course_id: Course ID

        Returns:
            Number of notifications sent

        Example:
            >>> count = await AssignmentService.notify_students_of_assignment(
            ...     db, assignment, course_id
            ... )
        """
        # Get course
        course_query = select(Course).where(Course.id == course_id)
        course_result = await db.execute(course_query)
        course = course_result.scalar_one_or_none()

        if not course:
            return 0

        # Get all students in the course
        members_query = select(CourseMember).where(
            CourseMember.course_id == course_id,
            CourseMember.role == "student"
        )
        members_result = await db.execute(members_query)
        members = members_result.scalars().all()

        # Create notifications
        notification_count = 0
        for member in members:
            await notification_service.create_notification(
                db,
                type="assignment",
                title=f"새 과제: {assignment.title}",
                content=f"마감일: {assignment.due_date.strftime('%Y-%m-%d %H:%M')}",
                link=f"/courses/{course_id}/assignments/{assignment.id}",
                related_id=assignment.id,
                user_id=member.user_id
            )
            notification_count += 1

        return notification_count

    @staticmethod
    async def notify_instructor_of_submission(
        db: AsyncSession,
        submission: Submission,
        student_id: UUID
    ) -> None:
        """
        Notify instructor/assistants when student submits assignment.

        Args:
            db: Database session
            submission: Submission instance
            student_id: Student user ID

        Example:
            >>> await AssignmentService.notify_instructor_of_submission(
            ...     db, submission, student_id
            ... )
        """
        # Get assignment
        assignment_query = select(Assignment).where(
            Assignment.id == submission.assignment_id
        )
        assignment_result = await db.execute(assignment_query)
        assignment = assignment_result.scalar_one_or_none()

        if not assignment:
            return

        # Get instructors and assistants
        staff_query = select(CourseMember).where(
            CourseMember.course_id == assignment.course_id,
            CourseMember.role.in_(["instructor", "assistant"])
        )
        staff_result = await db.execute(staff_query)
        staff_members = staff_result.scalars().all()

        # Create notifications
        for staff in staff_members:
            await notification_service.create_notification(
                db,
                type="submission",
                title=f"새 과제 제출: {assignment.title}",
                content=f"학생이 과제를 제출했습니다.",
                link=f"/courses/{assignment.course_id}/assignments/{assignment.id}/submissions",
                related_id=submission.id,
                user_id=staff.user_id
            )

    @staticmethod
    async def notify_student_of_grade(
        db: AsyncSession,
        grade: Grade,
        submission: Submission,
        student_id: UUID
    ) -> None:
        """
        Notify student when their submission is graded.

        Args:
            db: Database session
            grade: Grade instance
            submission: Submission instance
            student_id: Student user ID

        Example:
            >>> await AssignmentService.notify_student_of_grade(
            ...     db, grade, submission, student_id
            ... )
        """
        # Only notify if grade is released
        if not grade.is_released:
            return

        # Get assignment
        assignment_query = select(Assignment).where(
            Assignment.id == submission.assignment_id
        )
        assignment_result = await db.execute(assignment_query)
        assignment = assignment_result.scalar_one_or_none()

        if not assignment:
            return

        # Create notification
        await notification_service.create_notification(
            db,
            type="grade",
            title=f"채점 완료: {assignment.title}",
            content=f"점수: {grade.points}/{grade.max_points}",
            link=f"/courses/{assignment.course_id}/assignments/{assignment.id}",
            related_id=grade.id,
            user_id=student_id
        )

    @staticmethod
    async def check_late_submission(
        assignment: Assignment,
        submission_time: Optional[datetime] = None
    ) -> Dict:
        """
        Check if submission is late and calculate penalty.

        Args:
            assignment: Assignment instance
            submission_time: Submission time (default: now)

        Returns:
            Dictionary with:
            - is_late: bool
            - can_submit: bool
            - penalty_percent: int

        Example:
            >>> result = await AssignmentService.check_late_submission(
            ...     assignment
            ... )
            >>> if result['is_late']:
            ...     print(f"Late penalty: {result['penalty_percent']}%")
        """
        if submission_time is None:
            submission_time = datetime.utcnow()

        is_late = submission_time > assignment.due_date
        can_submit = True

        if is_late and not assignment.late_submission_allowed:
            can_submit = False

        penalty_percent = assignment.late_penalty_percent if is_late else 0

        return {
            'is_late': is_late,
            'can_submit': can_submit,
            'penalty_percent': penalty_percent
        }

    @staticmethod
    async def calculate_final_grade(
        base_points: float,
        max_points: float,
        is_late: bool,
        late_penalty_percent: int
    ) -> Dict:
        """
        Calculate final grade with late penalty applied.

        Args:
            base_points: Base points earned
            max_points: Maximum points possible
            is_late: Whether submission was late
            late_penalty_percent: Penalty percentage for late submission

        Returns:
            Dictionary with:
            - final_points: float
            - penalty_applied: float
            - percentage: float

        Example:
            >>> result = await AssignmentService.calculate_final_grade(
            ...     85, 100, True, 10
            ... )
            >>> print(result['final_points'])  # 76.5
        """
        penalty_applied = 0
        final_points = base_points

        if is_late and late_penalty_percent > 0:
            penalty_applied = base_points * (late_penalty_percent / 100)
            final_points = base_points - penalty_applied

        percentage = (final_points / max_points * 100) if max_points > 0 else 0

        return {
            'final_points': round(final_points, 2),
            'penalty_applied': round(penalty_applied, 2),
            'percentage': round(percentage, 1)
        }


# Create singleton instance
assignment_service = AssignmentService()
