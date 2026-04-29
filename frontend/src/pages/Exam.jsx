import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, ChevronRight, ChevronLeft, CheckCircle2, Grid, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Exam = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [chapterName, setChapterName] = useState("");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(() => {
    const saved = localStorage.getItem(`exam_current_q_${chapterId}`);
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(`exam_answers_${chapterId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [timeLeft, setTimeLeft] = useState(30 * 60); // fallback
  const [submitting, setSubmitting] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);

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
        setChapterName(data.chapter || "Exam");
        
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

        if (fetchedQuestions.length === 0) {
           toast.error("No questions found for this chapter.");
        }
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
        style: {
          border: '1px solid #f59e0b',
          padding: '16px',
          color: '#b45309',
          background: '#fffbeb',
        },
      });
    }

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timerInt = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerInt);
  }, [timeLeft, loading]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectChoice = async (choiceId) => {
    const currQId = questions[currentQuestionIdx].id;
    
    setAnswers(prev => ({
      ...prev,
      [currQId]: choiceId
    }));
    
    // Auto-advance logic disabled to let user review their choice or freely navigate
    // We could enable it but user might want to double check.

    try {
      await api.post('/api/student/submit-answer/', {
        question_id: currQId,
        selected_choice_id: choiceId
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error('Could not sync answer to server.');
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const jumpToQuestion = (idx) => {
    setCurrentQuestionIdx(idx);
    setShowNavigator(false); // Close mobile navigator on select
  };

  const getUnansweredQuestions = () => {
    return questions.filter(q => !answers[q.id]);
  };

  const initiateSubmit = () => {
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0 && !showSubmitWarning) {
      setShowSubmitWarning(true);
      setShowNavigator(true); // Open navigator to show skipped
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setShowSubmitWarning(false);
    try {
      await api.post('/api/student/submit-exam/', { chapter_id: chapterId });
      localStorage.removeItem(`exam_finish_time_${chapterId}`);
      localStorage.removeItem(`exam_current_q_${chapterId}`);
      localStorage.removeItem(`exam_answers_${chapterId}`);
      localStorage.removeItem(`exam_data_${chapterId}`);
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
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
         <p className="text-slate-500 font-medium tracking-wide">Loading Exam...</p>
       </div>
     );
  }

  if (!questions || questions.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
         <p className="text-slate-500 font-medium tracking-wide">No questions found for this exam.</p>
         <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
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

  const NavigatorPanel = () => (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Questions</h3>
        <span className="text-sm font-medium text-slate-500">{answeredCount} / {questions.length} answered</span>
      </div>
      
      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-4 gap-3 mb-8 overflow-y-auto max-h-[50vh] lg:max-h-[60vh] pr-2 custom-scrollbar">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isCurrent = currentQuestionIdx === idx;
          const isSkippedWarning = showSubmitWarning && !isAnswered;
          
          return (
            <button
              key={q.id}
              onClick={() => jumpToQuestion(idx)}
              className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all
                ${isCurrent ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110 z-10' : 'hover:scale-105'}
                ${isAnswered 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : isSkippedWarning
                    ? 'bg-red-50 text-red-600 border-2 border-red-200 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }
              `}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
            <span className="text-slate-600">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200"></div>
            <span className="text-slate-600">Unanswered</span>
          </div>
          {showSubmitWarning && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-50 border-2 border-red-200"></div>
              <span className="text-red-600 font-medium">Skipped</span>
            </div>
          )}
        </div>
        
        <button
          onClick={initiateSubmit}
          disabled={submitting}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${
             unansweredList.length > 0 && !showSubmitWarning
               ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-lg'
               : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
          } disabled:opacity-70 disabled:cursor-wait`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 size={20} />
          )}
          {unansweredList.length > 0 ? (showSubmitWarning ? 'Submit Anyway' : 'Review & Submit') : 'Submit Exam'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pt-4 pb-12 px-4">
      {/* Header & Timer Section */}
      <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Mobile Navigator Toggle */}
          <button 
            onClick={() => setShowNavigator(true)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Grid size={24} />
          </button>
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{chapterName}</h2>
            <p className="text-slate-500 text-sm">Question {currentQuestionIdx + 1} of {questions.length}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-mono text-xl font-bold transition-colors w-full sm:w-auto justify-center ${isTimeLow ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-800'}`}>
          <Clock size={22} className={isTimeLow ? 'animate-pulse' : ''} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 relative">
        
        {/* Left Column: Question Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-slate-500">Progress</span>
              <span className="text-indigo-600">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="bg-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>

          {/* Submit Warning Alert */}
          <AnimatePresence>
            {showSubmitWarning && unansweredList.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 overflow-hidden"
              >
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-800 text-lg">Unanswered Questions</h4>
                  <p className="text-amber-700 mt-1">
                    You have <span className="font-bold">{unansweredList.length}</span> skipped question(s). 
                    Please review them using the question navigator before submitting.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col relative flex-1 min-h-[60vh]">
            <div className="p-5 sm:p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-8 leading-relaxed">
                    <span className="text-indigo-500 mr-2">{currentQuestionIdx + 1}.</span>
                    {currentQ.question_text}
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4 pb-4">
                    {currentQ.choices.map((choice) => {
                      const isSelected = answers[currentQ.id] === choice.id;
                      
                      return (
                        <motion.button
                          whileHover={{ scale: 1.01, translateY: -2 }}
                          whileTap={{ scale: 0.98 }}
                          key={choice.id}
                          onClick={() => handleSelectChoice(choice.id)}
                          className={`group w-full flex items-start sm:items-center p-4 sm:p-5 rounded-2xl border-2 transition-colors duration-300 text-left relative overflow-hidden ${
                            isSelected 
                            ? 'border-indigo-600 bg-indigo-50/80 shadow-md' 
                            : 'border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50 hover:shadow-lg'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0 transition-all duration-300 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 scale-110' : 'border-slate-300 group-hover:border-indigo-400'
                          }`}>
                             {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-white" />}
                          </div>
                          <span className={`text-base sm:text-lg transition-colors duration-300 ${isSelected ? 'text-indigo-900 font-bold' : 'text-slate-700 group-hover:text-slate-900'}`}>
                            {choice.option_text}
                          </span>
                          
                          {/* Selected background highlight layer */}
                          {isSelected && (
                            <motion.div 
                              layoutId="selected-choice" 
                              className="absolute inset-0 border-2 border-indigo-600 rounded-2xl pointer-events-none" 
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            <div className="bg-slate-50 p-5 sm:px-8 flex items-center justify-between border-t border-slate-100 mt-auto">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              >
                <ChevronLeft size={20} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {isLastQuestion ? (
                 <button
                 onClick={initiateSubmit}
                 disabled={submitting}
                 className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-wait"
               >
                 {submitting ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                 ) : (
                   <CheckCircle2 size={20} />
                 )}
                 {unansweredList.length > 0 ? 'Review' : 'Submit'}
               </button>
              ) : (
                <button
                onClick={nextQuestion}
                className="flex items-center gap-1 sm:gap-2 px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={20} />
              </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Navigator Panel (Desktop) */}
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)]">
          <NavigatorPanel />
        </div>

        {/* Mobile Navigator Overlay */}
        <AnimatePresence>
          {showNavigator && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowNavigator(false)}
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="w-full h-[85vh] bg-transparent pb-4 px-2"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative h-full pt-10">
                  <button 
                    onClick={() => setShowNavigator(false)}
                    className="absolute top-0 right-4 p-2 bg-white rounded-full shadow-lg text-slate-700 hover:bg-slate-100 z-10"
                  >
                    <X size={24} />
                  </button>
                  <NavigatorPanel />
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
