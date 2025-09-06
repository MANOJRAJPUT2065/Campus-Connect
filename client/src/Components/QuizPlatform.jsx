import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaQuestion, FaPlay, FaPlus, FaEdit, FaTrash, FaChartBar, FaClock, FaCheck, FaTimes, FaTrophy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

const QuizPlatform = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('take'); // 'take', 'create', 'results'
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizResults, setQuizResults] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    questions: []
  });

  useEffect(() => {
    fetchQuizzes();
    fetchQuizResults();
  }, []);

  useEffect(() => {
    let timer;
    if (isQuizActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isQuizActive) {
      submitQuiz();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isQuizActive]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/quiz/quizzes'));
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/quiz/results'));
      if (response.ok) {
        const data = await response.json();
        setQuizResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to fetch quiz results:', error);
    }
  };

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeft(quiz.timeLimit * 60); // Convert to seconds
    setIsQuizActive(true);
    toast.success(`Started: ${quiz.title}`);
  };

  const submitQuiz = async () => {
    if (!currentQuiz) return;

    try {
      const score = calculateScore();
      const response = await fetch(buildApiUrl('/api/quiz/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: currentQuiz._id,
          answers: userAnswers,
          score,
          timeTaken: currentQuiz.timeLimit * 60 - timeLeft
        })
      });

      if (response.ok) {
        const result = await response.json();
        setQuizResults(prev => [result, ...prev]);
        toast.success(`Quiz completed! Score: ${score}/${currentQuiz.questions.length}`);
        resetQuiz();
      }
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const calculateScore = () => {
    if (!currentQuiz) return 0;
    
    let correct = 0;
    currentQuiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeft(0);
    setIsQuizActive(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const createQuiz = async () => {
    if (newQuiz.questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/quiz/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuiz)
      });

      if (response.ok) {
        toast.success('Quiz created successfully!');
        setShowCreateForm(false);
        setNewQuiz({ title: '', description: '', timeLimit: 30, questions: [] });
        fetchQuizzes();
      } else {
        toast.error('Failed to create quiz');
      }
    } catch (error) {
      toast.error('Error creating quiz');
    }
  };

  const addQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isQuizActive && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Quiz Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{currentQuiz.title}</h2>
                <p className="text-blue-100">{currentQuiz.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-300">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm">Time Remaining</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </div>
              <div className="text-sm">
                Score: {calculateScore()}/{currentQuiz.questions.length}
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      userAnswers[currentQuestionIndex] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                        userAnswers[currentQuestionIndex] === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {userAnswers[currentQuestionIndex] === index && (
                          <FaCheck className="text-white text-sm" />
                        )}
                      </div>
                      <span className="text-lg">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="flex space-x-2">
                {currentQuiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded text-sm ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : userAnswers[index] !== undefined
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FaQuestion className="text-3xl" />
              <div>
                <h2 className="text-3xl font-bold">Quiz Platform</h2>
                <p className="text-green-100">Test your knowledge and practice coding</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('take')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'take'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaPlay className="inline mr-2" />
            Take Quiz
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaPlus className="inline mr-2" />
            Create Quiz
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Results
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'take' && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Available Quizzes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <motion.div
                    key={quiz._id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <h4 className="text-xl font-semibold mb-2">{quiz.title}</h4>
                      <p className="text-gray-600 mb-4">{quiz.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <FaQuestion className="mr-1" />
                          {quiz.questions.length} questions
                        </span>
                        <span className="flex items-center">
                          <FaClock className="mr-1" />
                          {quiz.timeLimit} min
                        </span>
                      </div>
                      
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Start Quiz
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Create New Quiz</h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {showCreateForm ? 'Cancel' : 'New Quiz'}
                </button>
              </div>

              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-6 rounded-lg border"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Title
                      </label>
                      <input
                        type="text"
                        value={newQuiz.title}
                        onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter quiz title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={newQuiz.timeLimit}
                        onChange={(e) => setNewQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newQuiz.description}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Enter quiz description"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Questions
                      </label>
                      <button
                        onClick={addQuestion}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Add Question
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {newQuiz.questions.map((question, qIndex) => (
                        <div key={qIndex} className="bg-white p-4 rounded border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Question {qIndex + 1}</span>
                            <button
                              onClick={() => removeQuestion(qIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            className="w-full px-3 py-2 border rounded mb-3 focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter question"
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={question.correctAnswer === oIndex}
                                  onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                  className="text-blue-600"
                                />
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[oIndex] = e.target.value;
                                    updateQuestion(qIndex, 'options', newOptions);
                                  }}
                                  className="flex-1 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={createQuiz}
                    disabled={newQuiz.title === '' || newQuiz.questions.length === 0}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    Create Quiz
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Quiz Results</h3>
              <div className="space-y-4">
                {quizResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-semibold">{result.quizTitle}</h4>
                        <p className="text-gray-600">
                          Score: {result.score}/{result.totalQuestions}
                        </p>
                        <p className="text-sm text-gray-500">
                          Completed: {new Date(result.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {Math.round((result.score / result.totalQuestions) * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">Accuracy</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>Time taken: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                      {result.score === result.totalQuestions && (
                        <span className="text-yellow-600 font-semibold flex items-center">
                          <FaTrophy className="mr-1" />
                          Perfect Score!
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {quizResults.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FaChartBar className="text-6xl mx-auto mb-4 text-gray-300" />
                    <p>No quiz results yet. Take a quiz to see your performance!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuizPlatform;
