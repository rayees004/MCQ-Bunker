import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, ChevronRight, ChevronLeft, CheckCircle2, Grid, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ─────────────────────────────────────────────────────────────────────
   NavigatorPanel — defined OUTSIDE Exam so React never unmounts/remounts
   it on timer ticks. This keeps the grid scroll-position stable and
   prevents CSS animations from restarting every second.
───────────────────────────────────────────────────────────────────── */
const NavigatorPanel = ({
  questions,
  answers,
  currentQuestionIdx,
  answeredCount,
  showSubmitWarning,
  submitting,
  unansweredList,
  gridRef,
  firstSkippedIdx,
  firstSkippedBtnRef,
  jumpToQuestion,
  initiateSubmit,
}) => (
  <div
    className="rounded-2xl p-4 flex flex-col h-full"
    style={{
      background: 'var(--bg-surface-solid)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
    }}
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Questions</h3>
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {answeredCount} / {questions.length} answered
      </span>
    </div>

    {/* Grid */}
    <div
      ref={gridRef}
      className="grid gap-1.5 mb-4 overflow-y-auto"
      style={{
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        maxHeight: '52vh',
        paddingTop: '3px',
        paddingLeft: '3px',
        paddingRight: '6px',
        overflowX: 'visible',
      }}
    >
      {questions.map((q, idx) => {
        const isAnswered = !!answers[q.id];
        const isCurrent = currentQuestionIdx === idx;
        const isSkipped = showSubmitWarning && !isAnswered;
        const isFirstSkipped = idx === firstSkippedIdx;

        return (
          <button
            key={q.id}
            ref={isFirstSkipped ? firstSkippedBtnRef : null}
            onClick={() => jumpToQuestion(idx)}
            className="w-full aspect-square rounded-lg flex items-center justify-center font-semibold text-xs transition-all hover:opacity-80"
            style={{
              outline: isCurrent ? '2px solid var(--brand-500)' : 'none',
              outlineOffset: isCurrent ? '2px' : '0',
              background: isAnswered
                ? 'var(--brand-600)'
                : isSkipped
                  ? 'rgba(239,68,68,0.12)'
                  : 'var(--bg-muted)',
              color: isAnswered
                ? '#fff'
                : isSkipped
                  ? '#ef4444'
                  : 'var(--text-secondary)',
              border: isSkipped
                ? '2px solid rgba(239,68,68,0.5)'
                : isAnswered
                  ? '2px solid transparent'
                  : '1px solid var(--border-subtle)',
              /* Use animationName so the DOM attribute stays stable;
                 the animation plays continuously without restarting */
              animationName: isSkipped ? 'pulse' : 'none',
              animationDuration: '2s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>

    {/* Legend */}
    <div className="pt-3 mt-auto" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--brand-600)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Unanswered</span>
        </div>
        {showSubmitWarning && (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.5)' }} />
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Skipped</span>
          </div>
        )}
      </div>

      <button
        onClick={initiateSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-md transition-all disabled:opacity-70 disabled:cursor-wait"
        style={{
          background: unansweredList.length > 0 && !showSubmitWarning
            ? 'linear-gradient(135deg,#f59e0b,#d97706)'
            : 'linear-gradient(135deg,var(--brand-500),var(--brand-700))',
        }}
      >
        {submitting
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <CheckCircle2 size={20} />}
        {unansweredList.length > 0
          ? (showSubmitWarning ? 'Submit Anyway' : 'Review & Submit')
          : 'Submit Exam'}
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────── */

const Exam = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [chapterName, setChapterName] = useState('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(() => {
    const saved = localStorage.getItem(`exam_current_q_${chapterId}`);
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(`exam_answers_${chapterId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);

  const gridRef = useRef(null);
  const firstSkippedBtnRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`exam_current_q_${chapterId}`, currentQuestionIdx);
  }, [currentQuestionIdx, chapterId]);

  useEffect(() => {
    localStorage.setItem(`exam_answers_${chapterId}`, JSON.stringify(answers));
  }, [answers, chapterId]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const cachedDataStr = localStorage.getItem(`exam_data_${chapterId}`);
        let data;
        if (cachedDataStr) {
          data = JSON.parse(cachedDataStr);
        } else {
          const response = await api.get(`/api/student/chapters/${chapterId}/questions/`);
          data = response.data;
          localStorage.setItem(`exam_data_${chapterId}`, JSON.stringify(data));
        }

        const fetchedQuestions = data.questions || [];
        setChapterName(data.chapter || 'Exam');

        if (data.time_limit_minutes) {
          const storedFinishTime = localStorage.getItem(`exam_finish_time_${chapterId}`);
          if (storedFinishTime && parseInt(storedFinishTime, 10) > Date.now()) {
            setTimeLeft(Math.floor((parseInt(storedFinishTime, 10) - Date.now()) / 1000));
          } else {
            const newTimeLeft = data.time_limit_minutes * 60;
            setTimeLeft(newTimeLeft);
            localStorage.setItem(`exam_finish_time_${chapterId}`, Date.now() + newTimeLeft * 1000);
          }
        }

        if (fetchedQuestions.length === 0) toast.error('No questions found for this chapter.');
        setQuestions(fetchedQuestions);
      } catch (error) {
        toast.error('Failed to load questions.');
        console.error('Fetch questions error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [chapterId]);

  useEffect(() => {
    if (loading) return;
    if (timeLeft === 300) {
      toast('Only 5 minutes remaining!', {
        icon: '⏳',
        duration: 5000,
        style: { border: '1px solid #f59e0b', padding: '16px', color: '#b45309', background: '#fffbeb' },
      });
    }
    if (timeLeft <= 0) { handleFinalSubmit(); return; }
    const timerInt = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerInt);
  }, [timeLeft, loading]);

  // Scroll the grid to the first skipped question once warning appears
  useEffect(() => {
    if (showSubmitWarning && firstSkippedBtnRef.current && gridRef.current) {
      setTimeout(() => {
        firstSkippedBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [showSubmitWarning]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectChoice = async (choiceId) => {
    const currQId = questions[currentQuestionIdx].id;
    setAnswers(prev => ({ ...prev, [currQId]: choiceId }));
    try {
      await api.post('/api/student/submit-answer/', { question_id: currQId, selected_choice_id: choiceId });
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error('Could not sync answer to server.');
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) setCurrentQuestionIdx(prev => prev + 1);
  };
  const prevQuestion = () => {
    if (currentQuestionIdx > 0) setCurrentQuestionIdx(prev => prev - 1);
  };

  const jumpToQuestion = (idx) => {
    setCurrentQuestionIdx(idx);
    setShowNavigator(false);
  };

  const getUnansweredQuestions = useCallback(
    () => questions.filter(q => !answers[q.id]),
    [questions, answers]
  );

  const initiateSubmit = () => {
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0 && !showSubmitWarning) {
      setShowSubmitWarning(true);
      setShowNavigator(true);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setShowSubmitWarning(false);
    try {
      await api.post('/api/student/submit-exam/', { chapter_id: chapterId });
      ['exam_finish_time', 'exam_current_q', 'exam_answers', 'exam_data'].forEach(k =>
        localStorage.removeItem(`${k}_${chapterId}`)
      );
      toast.success('Exam submitted successfully!');
      navigate('/results');
    } catch (error) {
      console.error('Final submit error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit exam.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>Loading Exam...</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>No questions found for this exam.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2.5 rounded-xl font-medium transition-colors text-white"
          style={{ background: 'var(--brand-600)' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const isTimeLow = timeLeft < 300;
  const unansweredList = getUnansweredQuestions();
  // Compute first skipped index once per render (stable, no mutable variable tricks)
  const firstSkippedIdx = showSubmitWarning
    ? questions.findIndex(q => !answers[q.id])
    : -1;

  // Shared props for NavigatorPanel
  const navigatorProps = {
    questions,
    answers,
    currentQuestionIdx,
    answeredCount,
    showSubmitWarning,
    submitting,
    unansweredList,
    gridRef,
    firstSkippedIdx,
    firstSkippedBtnRef,
    jumpToQuestion,
    initiateSubmit,
  };

  return (
    <div className="max-w-7xl mx-auto pt-3 pb-8 px-3 sm:px-4">

      {/* ── Header & Timer ─────────────────────────────── */}
      <div
        className="mb-4 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-2 relative z-20"
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile Navigator Toggle */}
          <button
            onClick={() => setShowNavigator(true)}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
          >
            <Grid size={24} />
          </button>
          <div>
            <h2 className="text-base font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{chapterName}</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Question {currentQuestionIdx + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold transition-colors w-full sm:w-auto justify-center"
          style={isTimeLow
            ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
            : { background: 'var(--bg-muted)', color: 'var(--text-primary)' }
          }
        >
          <Clock size={16} className={isTimeLow ? 'animate-pulse' : ''} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 relative">

        {/* Left Column */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
              <span style={{ color: 'var(--brand-500)' }}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
              <motion.div
                className="h-1.5 rounded-full"
                style={{ background: 'var(--brand-600)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Submit Warning Alert */}
          <AnimatePresence>
            {showSubmitWarning && unansweredList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 rounded-xl flex items-start gap-2 overflow-hidden"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: '#b45309' }}>Unanswered Questions</h4>
                  <p className="mt-0.5 text-xs" style={{ color: '#92400e' }}>
                    You have <span className="font-bold">{unansweredList.length}</span> skipped question(s).
                    Please review them using the question navigator before submitting.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Card */}
          <div
            className="rounded-2xl overflow-hidden flex flex-col relative flex-1 min-h-[50vh]"
            style={{
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-sm sm:text-base font-semibold mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    <span className="mr-1.5" style={{ color: 'var(--brand-400)' }}>{currentQuestionIdx + 1}.</span>
                    {currentQ.question_text}
                  </h3>

                  <div className="space-y-2 pb-3">
                    {currentQ.choices.map((choice) => {
                      const isSelected = answers[currentQ.id] === choice.id;
                      return (
                        <motion.button
                          whileHover={{ scale: 1.01, translateY: -2 }}
                          whileTap={{ scale: 0.98 }}
                          key={choice.id}
                          onClick={() => handleSelectChoice(choice.id)}
                          className="group w-full flex items-center p-3 sm:p-4 rounded-xl border-2 transition-colors duration-300 text-left relative overflow-hidden"
                          style={isSelected
                            ? { borderColor: 'var(--brand-600)', background: 'rgba(99,102,241,0.08)', boxShadow: 'var(--shadow-sm)' }
                            : { borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-solid)' }
                          }
                        >
                          <div
                            className="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                            style={isSelected
                              ? { borderColor: 'var(--brand-600)', background: 'var(--brand-600)', transform: 'scale(1.1)' }
                              : { borderColor: 'var(--border-default)' }
                            }
                          >
                            {isSelected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span
                            className="text-xs sm:text-sm transition-colors duration-300"
                            style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 600 : 400 }}
                          >
                            {choice.option_text}
                          </span>
                          {isSelected && (
                            <motion.div
                              layoutId="selected-choice"
                              className="absolute inset-0 rounded-2xl pointer-events-none"
                              style={{ border: '2px solid var(--brand-600)' }}
                              initial={false}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div
              className="p-3 sm:px-6 flex items-center justify-between mt-auto"
              style={{ background: 'var(--bg-muted)', borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1 px-3 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {isLastQuestion ? (
                <button
                  onClick={initiateSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-wait"
                  style={{ background: 'linear-gradient(135deg,var(--brand-500),var(--brand-700))' }}
                >
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <CheckCircle2 size={16} />}
                  {unansweredList.length > 0 ? 'Review' : 'Submit'}
                </button>
              ) : (
                /* ── Next button: gradient so text is always visible in both themes ── */
                <button
                  onClick={nextQuestion}
                  className="flex items-center gap-1 px-4 sm:px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg,var(--brand-500),var(--brand-700))' }}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Navigator Panel (Desktop) */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-20 h-[calc(100vh-7rem)]">
          <NavigatorPanel {...navigatorProps} />
        </div>

        {/* Mobile Navigator Overlay */}
        <AnimatePresence>
          {showNavigator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 flex items-end"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowNavigator(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="w-full h-[85vh] pb-4 px-2"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative h-full pt-10">
                  <button
                    onClick={() => setShowNavigator(false)}
                    className="absolute top-0 right-4 p-2 rounded-full shadow-lg z-10"
                    style={{ background: 'var(--bg-surface-solid)', color: 'var(--text-primary)' }}
                  >
                    <X size={24} />
                  </button>
                  <NavigatorPanel {...navigatorProps} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Exam;
