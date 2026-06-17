import React, { useState } from 'react';
import { X, Activity, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';

// Perceived Stress Scale (PSS-10) by Sheldon Cohen (1983)
const QUESTIONS = [
  { text: "1. In the last month, how often have you been upset because of something that happened unexpectedly?", reverse: false },
  { text: "2. In the last month, how often have you felt that you were unable to control the important things in your life?", reverse: false },
  { text: "3. In the last month, how often have you felt nervous and 'stressed'?", reverse: false },
  { text: "4. In the last month, how often have you felt confident about your ability to handle your personal problems?", reverse: true },
  { text: "5. In the last month, how often have you felt that things were going your way?", reverse: true },
  { text: "6. In the last month, how often have you found that you could not cope with all the things that you had to do?", reverse: false },
  { text: "7. In the last month, how often have you been able to control irritations in your life?", reverse: true },
  { text: "8. In the last month, how often have you felt that you were on top of things?", reverse: true },
  { text: "9. In the last month, how often have you been angered because of things that were outside of your control?", reverse: false },
  { text: "10. In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", reverse: false }
];

const OPTIONS = [
  { label: 'Never', value: 0 },
  { label: 'Almost Never', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Fairly Often', value: 3 },
  { label: 'Very Often', value: 4 }
];

const StressTestModal = ({ isOpen, onClose, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(new Array(QUESTIONS.length).fill(null));
  const [isCalculated, setIsCalculated] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  if (!isOpen) return null;

  const handleSelect = (val) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = val;
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(q => q + 1), 300); // smooth auto-advance
    } else {
      // Calculate PSS-10 Score (0 to 40)
      let totalScore = 0;
      newAnswers.forEach((ans, idx) => {
        const q = QUESTIONS[idx];
        // Reverse scoring for questions 4, 5, 7, 8: 0=4, 1=3, 2=2, 3=1, 4=0
        if (q.reverse) {
          totalScore += (4 - ans);
        } else {
          totalScore += ans;
        }
      });
      
      // Map PSS-10 Score (0-40) to our 1-10 Scale
      let level = Math.round((totalScore / 40) * 10);
      if (level < 1) level = 1;
      if (level > 10) level = 10;
      
      setFinalScore(level);
      setTimeout(() => setIsCalculated(true), 400);
    }
  };

  const handleFinish = () => {
    onComplete(finalScore);
    setTimeout(() => {
      setCurrentQuestion(0);
      setAnswers(new Array(QUESTIONS.length).fill(null));
      setIsCalculated(false);
      setFinalScore(null);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Stress Assessment</h3>
              <p className="text-xs text-blue-200 flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3" /> PSS-10 Standardized Test</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 relative">
          {!isCalculated ? (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center text-sm font-medium text-gray-400">
                <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
                <div className="flex gap-1">
                  {QUESTIONS.map((_, idx) => (
                    <div key={idx} className={`h-1.5 w-3 sm:w-4 rounded-full ${idx <= currentQuestion ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
              
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 leading-relaxed min-h-[80px]">
                {QUESTIONS[currentQuestion].text}
              </h4>

              <div className="space-y-3">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                      answers[currentQuestion] === opt.value 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-md transform scale-[1.02]' 
                        : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/50 text-gray-700 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {answers[currentQuestion] === opt.value && <CheckCircle2 className="w-5 h-5 text-blue-500 animate-in zoom-in" />}
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button 
                  onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-opacity"
                >
                  Previous
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full mx-auto flex items-center justify-center shadow-inner">
                <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {finalScore}
                </span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Analysis Complete</h4>
                <p className="text-gray-500 mt-2 text-sm">
                  Based on the Cohen's Perceived Stress Scale (PSS-10), your estimated stress level is <strong>{finalScore} out of 10</strong>.
                </p>
              </div>
              <button 
                onClick={handleFinish}
                className="w-full mt-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transform transition-all hover:-translate-y-1 flex justify-center items-center gap-2"
              >
                Apply to Prediction
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Academic Citation Footer */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-[10px] text-gray-300">
              Reference: Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressTestModal;
