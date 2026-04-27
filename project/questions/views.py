from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Question, Choice
from .serializers import (
    QuestionCreateSerializer,
    QuestionSerializer,
    QuestionStudentSerializer,
)
from subjects.models import Chapter
from accounts.permissions import IsAdmin, IsStudent


# ─── ADMIN: Question endpoints ─────────────────────────────────────────────────

class AdminQuestionCreateView(generics.CreateAPIView):
    """
    POST /api/admin/questions/
    Body: { chapter, question_text, choices: [{option_text, is_correct}] }
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = QuestionCreateSerializer
    queryset = Question.objects.all()


class AdminQuestionUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/admin/questions/<id>/
    PUT    /api/admin/questions/<id>/
    DELETE /api/admin/questions/<id>/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Question.objects.prefetch_related("choices").all()

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return QuestionCreateSerializer
        return QuestionSerializer


# ─── STUDENT: Questions for a chapter ─────────────────────────────────────────

class StudentChapterQuestionsView(APIView):
    """
    GET /api/student/chapters/<id>/questions/
    Returns limited questions (up to chapter.total_questions).
    Choices do NOT include is_correct.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request, pk):
        chapter = get_object_or_404(Chapter, pk=pk)
        questions = (
            Question.objects.filter(chapter=chapter).order_by("?")[0: chapter.total_questions]  # random selection
        )
        serializer = QuestionStudentSerializer(questions, many=True)
        return Response(
            {
                "chapter": chapter.name,
                "time_limit_minutes": chapter.time_limit,
                "total_questions": chapter.total_questions,
                "questions": serializer.data,
            }
        )
