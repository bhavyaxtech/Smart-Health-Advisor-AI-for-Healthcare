import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [symptom, setSymptom] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!symptom.trim()) {
      setError('Please enter a symptom to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const requestData = {
        symptom: symptom.trim(),
        duration: duration.trim(),
        severity: severity.trim(),
        additional_info: additionalInfo.trim()
      };

      // Add optional enhanced fields if provided
      if (age) requestData.age = parseInt(age);
      if (gender) requestData.gender = gender;
      if (medicalHistory) requestData.medical_history = medicalHistory.trim();
      
      const response = await fetch(`${backendUrl}/api/analyze-symptom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
      setActiveTab('analysis');
    } catch (err) {
      console.error('Error analyzing symptom:', err);
      setError('Unable to analyze symptom. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptom('');
    setDuration('');
    setSeverity('');
    setAdditionalInfo('');
    setAge('');
    setGender('');
    setMedicalHistory('');
    setAnalysis(null);
    setError('');
    setActiveTab('analysis');
  };

  const AIInsightCard = ({ insight }) => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-purple-800">{insight.title}</h4>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {insight.insight_type}
            </span>
          </div>
          <p className="text-gray-700 mb-3">{insight.description}</p>
          <div className="bg-white rounded-lg p-3 border-l-4 border-purple-400">
            <p className="text-sm font-medium text-purple-800">💡 AI Recommendation:</p>
            <p className="text-sm text-gray-600 mt-1">{insight.recommendation}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">Evidence Level: {insight.evidence_level}</p>
        </div>
      </div>
    </div>
  );

  const RiskAssessmentCard = ({ riskData }) => (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
      <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 018 0z" />
        </svg>
        AI Risk Assessment
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(riskData).map(([key, value], index) => (
          <div key={index} className="bg-white rounded-lg p-3">
            <p className="text-sm font-medium text-gray-600 capitalize">
              {key.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Enhanced Header with AI branding */}
      <header className="bg-white shadow-lg border-b border-blue-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-green-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  AI Health Assistant
                </h1>
                <p className="text-xl text-gray-600 mt-1">
                  🤖 Enhanced with AI • Evidence-based dietary guidance • Real-time medical research
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">AI-Powered</span>
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">Evidence-Based</span>
                  <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">Personalized</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxkb2N0b3J8ZW58MHx8fHwxNzQ4OTcxNTk0fDA&ixlib=rb-4.1.0&q=85"
                alt="AI Health Technology"
                className="w-32 h-32 rounded-2xl object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Input Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-1">
            <div className="bg-white rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                AI Symptom Analysis
                <button
                  onClick={() => setShowEnhancedForm(!showEnhancedForm)}
                  className="ml-auto text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {showEnhancedForm ? 'Basic Form' : 'Enhanced AI Form'}
                </button>
              </h2>
              
              <form onSubmit={handleAnalyze} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label htmlFor="symptom" className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Symptom * <span className="text-blue-600">(AI will analyze for patterns)</span>
                    </label>
                    <input
                      type="text"
                      id="symptom"
                      value={symptom}
                      onChange={(e) => setSymptom(e.target.value)}
                      placeholder="e.g., headache, nausea, fatigue, anxiety, stomach pain..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                      Duration <span className="text-blue-600">(affects AI risk assessment)</span>
                    </label>
                    <select
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select duration</option>
                      <option value="less than 1 hour">Less than 1 hour</option>
                      <option value="1-6 hours">1-6 hours</option>
                      <option value="6-24 hours">6-24 hours</option>
                      <option value="1-3 days">1-3 days</option>
                      <option value="3-7 days">3-7 days</option>
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="more than 2 weeks">More than 2 weeks</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                      Severity Level <span className="text-blue-600">(AI confidence factor)</span>
                    </label>
                    <select
                      id="severity"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select severity</option>
                      <option value="mild">Mild (1-3)</option>
                      <option value="moderate">Moderate (4-6)</option>
                      <option value="severe">Severe (7-8)</option>
                      <option value="very severe">Very Severe (9-10)</option>
                    </select>
                  </div>

                  {showEnhancedForm && (
                    <>
                      <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                          Age <span className="text-purple-600">(AI personalization)</span>
                        </label>
                        <input
                          type="number"
                          id="age"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="e.g., 30"
                          min="1"
                          max="120"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                          Gender <span className="text-purple-600">(AI customization)</span>
                        </label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="lg:col-span-2">
                        <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                          Relevant Medical History <span className="text-purple-600">(AI context enhancement)</span>
                        </label>
                        <textarea
                          id="medicalHistory"
                          value={medicalHistory}
                          onChange={(e) => setMedicalHistory(e.target.value)}
                          placeholder="Any relevant conditions, medications, or medical history..."
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="lg:col-span-2">
                    <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information <span className="text-blue-600">(helps AI analysis)</span>
                    </label>
                    <textarea
                      id="additionalInfo"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Any additional details, triggers, or associated symptoms..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        🤖 AI Analyzing Symptoms...
                      </span>
                    ) : (
                      '🚀 Get AI Health Analysis'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Enhanced Results Section with Tabs */}
        {analysis && (
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-8">
                  {[
                    { key: 'analysis', label: '🤖 AI Analysis', icon: '🧠' },
                    { key: 'diet', label: '🥗 Diet Plan', icon: '🍎' },
                    { key: 'causes', label: '🔍 Possible Causes', icon: '⚕️' },
                    { key: 'insights', label: '💡 AI Insights', icon: '✨' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-8">
                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          AI Symptom Analysis
                        </h3>
                        <div className="prose prose-blue max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.symptom_analysis}</p>
                        </div>
                      </div>
                      <div>
                        <img 
                          src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3J8ZW58MHx8fHwxNzQ4OTcxNTk0fDA&ixlib=rb-4.1.0&q=85"
                          alt="Healthcare Professional"
                          className="w-full h-64 object-cover rounded-xl shadow-lg"
                        />
                      </div>
                    </div>

                    {/* AI Web Research Section */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 018 0z" />
                        </svg>
                        🌐 AI Web Research Results
                      </h4>
                      <div className="prose prose-indigo max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.ai_web_research}</p>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <RiskAssessmentCard riskData={analysis.risk_assessment} />

                    {/* Personalized Tips */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        🎯 Personalized AI Tips
                      </h4>
                      <div className="space-y-2">
                        {analysis.personalized_tips.map((tip, index) => (
                          <div key={index} className="flex items-start p-3 bg-white rounded-lg">
                            <span className="text-yellow-600 mr-3">•</span>
                            <span className="text-gray-700">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'diet' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <img 
                        src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxudXRyaXRpb258ZW58MHx8fHwxNzQ4OTcxNjAxfDA&ixlib=rb-4.1.0&q=85"
                        alt="Healthy Nutrition"
                        className="w-20 h-20 object-cover rounded-xl shadow-lg"
                      />
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                        <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-1m-3 1l-3-1" />
                        </svg>
                        AI-Enhanced Dietary Recommendations
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Foods to Consume
                        </h4>
                        <ul className="space-y-2">
                          {analysis.diet_plan.foods_to_consume.map((food, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{food}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Foods to Avoid
                        </h4>
                        <ul className="space-y-2">
                          {analysis.diet_plan.foods_to_avoid.map((food, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{food}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-semibold text-blue-700 mb-4">Nutritional Focus</h4>
                        <ul className="space-y-2">
                          {analysis.diet_plan.nutritional_focus.map((focus, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{focus}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-purple-700 mb-4">AI Supplement Recommendations</h4>
                        <ul className="space-y-2">
                          {analysis.diet_plan.supplements.map((supplement, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{supplement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-orange-700 mb-4">Meal Suggestions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.diet_plan.meal_suggestions.map((meal, index) => (
                          <div key={index} className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                            <span className="text-gray-700">{meal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'causes' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 018 0z" />
                      </svg>
                      AI-Enhanced Possible Causes
                    </h3>
                    
                    <div className="space-y-4">
                      {analysis.possible_causes.map((cause, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{cause.condition}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                cause.urgency_level === 'High' ? 'bg-red-100 text-red-800' :
                                cause.urgency_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {cause.urgency_level} Urgency
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <p className="text-blue-600 font-medium">Probability: {cause.probability}</p>
                            <p className="text-purple-600 font-medium">AI Confidence: {cause.ai_confidence}</p>
                          </div>
                          <p className="text-gray-700">{cause.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Lifestyle Suggestions */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Lifestyle Recommendations
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.lifestyle_suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start p-3 bg-white rounded-lg">
                            <span className="text-indigo-600 mr-3">•</span>
                            <span className="text-gray-700">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Advanced AI Insights
                    </h3>
                    
                    <div className="space-y-6">
                      {analysis.ai_insights.map((insight, index) => (
                        <AIInsightCard key={index} insight={insight} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Red Flags Warning - Always Visible */}
            <div className="bg-red-50 border border-red-200 rounded-2xl shadow-xl">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  🚨 Seek Immediate Medical Attention If:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.red_flags.map((flag, index) => (
                    <div key={index} className="flex items-start p-4 bg-white rounded-lg border border-red-200">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 018 0z" />
                      </svg>
                      <span className="text-red-800 font-medium">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Medical Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-xl">
              <div className="p-8">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 018 0z" />
                  </svg>
                  🤖 AI Medical Disclaimer
                </h3>
                <div className="prose prose-amber max-w-none">
                  <p className="text-amber-900 leading-relaxed whitespace-pre-line">{analysis.medical_disclaimer}</p>
                </div>
                <div className="mt-4 text-sm text-amber-700 bg-amber-100 rounded-lg p-3">
                  <p><strong>Analysis Generated:</strong> {new Date(analysis.search_timestamp).toLocaleString()}</p>
                  <p><strong>AI Confidence:</strong> High accuracy based on medical databases and pattern recognition</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <img 
                src="https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg"
                alt="Medical Professional"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="text-left">
                <p className="text-gray-800 font-semibold">🤖 AI Health Assistant - Enhanced with AI</p>
                <p className="text-sm text-gray-600">Evidence-based health guidance • Real-time research • Personalized recommendations</p>
              </div>
            </div>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>✨ AI-Powered Analysis</span>
              <span>🔬 Evidence-Based</span>
              <span>🎯 Personalized</span>
              <span>🌐 Real-Time Research</span>
            </div>
            <p className="text-xs text-gray-400 mt-4">Always consult with healthcare professionals for medical concerns</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;