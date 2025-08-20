import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [showConsole, setShowConsole] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('run');
  const editorRef = useRef(null);
  const consoleRef = useRef(null);
  let { problemId } = useParams();

  const { handleSubmit } = useForm();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
        setProblem(response.data);
        setCode(initialCode);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    setShowConsole(true);
    setActiveConsoleTab('run');

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error',
        testCases: []
      });
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    setShowConsole(true);
    setActiveConsoleTab('submit');

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });
      setSubmitResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 badge-outline-green';
      case 'medium': return 'text-yellow-500 badge-outline-yellow';
      case 'hard': return 'text-red-500 badge-outline-red';
      default: return 'text-gray-500 badge-outline-gray';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-base-100 font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-center p-4 bg-base-200 border-b border-base-300 shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-base-content">
            {problem?.title || 'Loading...'}
          </h1>
          {problem && (
            <>
              <div className={`badge badge-outline ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </div>
              <div className="badge badge-primary">{problem.tags}</div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['javascript', 'java', 'cpp'].map((lang) => (
              <button
                key={lang}
                className={`btn btn-sm ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleLanguageChange(lang)}
              >
                {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
              </button>
            ))}
          </div>
          <button
            className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`}
            onClick={handleRun}
            disabled={loading}
          >
            Run
          </button>
          <button
            className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}
            onClick={handleSubmitCode}
            disabled={loading}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Problem Details */}
        <div className="flex flex-col w-1/2 overflow-y-auto p-6 bg-base-100 border-r border-base-300">
          <div className="tabs tabs-boxed bg-base-200 rounded-lg p-1">
            <button
              className={`tab ${activeLeftTab === 'description' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('description')}
            >
              Description
            </button>
            <button
              className={`tab ${activeLeftTab === 'editorial' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('editorial')}
            >
              Editorial
            </button>
            <button
              className={`tab ${activeLeftTab === 'solutions' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('solutions')}
            >
              Solutions
            </button>
            <button
              className={`tab ${activeLeftTab === 'submissions' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('submissions')}
            >
              Submissions
            </button>
            <button
              className={`tab ${activeLeftTab === 'chatAI' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('chatAI')}
            >
              ChatAI
            </button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto pr-2">
            {problem && (
              <>
                {activeLeftTab === 'description' && (
                  <div className="prose max-w-none text-base-content">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {problem.description}
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4 text-base-content">Examples:</h3>
                      <div className="space-y-4">
                        {problem.visibleTestCases.map((example, index) => (
                          <div key={index} className="bg-base-200 p-4 rounded-lg shadow-inner">
                            <h4 className="font-semibold mb-2">Example {index + 1}:</h4>
                            <div className="space-y-2 text-sm font-mono text-base-content">
                              <div><strong>Input:</strong> {example.input}</div>
                              <div><strong>Output:</strong> {example.output}</div>
                              <div><strong>Explanation:</strong> {example.explanation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeLeftTab === 'editorial' && (
                  <div className="prose max-w-none text-base-content">
                    <h2 className="text-xl font-bold mb-4">Editorial</h2>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                    </div>
                  </div>
                )}
                {activeLeftTab === 'solutions' && (
                  <div className="prose max-w-none text-base-content">
                    <h2 className="text-xl font-bold mb-4">Solutions</h2>
                    <div className="space-y-6">
                      {problem.referenceSolution?.length > 0 ? (
                        problem.referenceSolution.map((solution, index) => (
                          <div key={index} className="border border-base-300 rounded-lg shadow">
                            <div className="bg-base-200 px-4 py-2 rounded-t-lg">
                              <h3 className="font-semibold">{problem?.title} - {solution?.language}</h3>
                            </div>
                            <div className="p-4">
                              <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto text-base-content">
                                <code>{solution?.completeCode}</code>
                              </pre>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">Solutions will be available after you solve the problem.</p>
                      )}
                    </div>
                  </div>
                )}
                {activeLeftTab === 'submissions' && (
                  <div className="prose max-w-none text-base-content">
                    <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                    <div className="text-gray-500">
                      <SubmissionHistory problemId={problemId} />
                    </div>
                  </div>
                )}
                {activeLeftTab === 'chatAI' && (
                  <div className="prose max-w-none text-base-content">
                    <h2 className="text-xl font-bold mb-4">CHAT with AI</h2>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      <ChatAi problem={problem}></ChatAi>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor & Console */}
        <div className="flex flex-col flex-1 bg-base-200">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={getLanguageForMonaco(selectedLanguage)}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                mouseWheelZoom: true,
              }}
            />
          </div>

          {/* Console Panel (Collapsible) */}
          <div
            ref={consoleRef}
            className={`bg-base-300 text-base-content transition-all duration-300 ease-in-out ${showConsole ? 'h-1/3 min-h-[150px]' : 'h-0'}`}
          >
            <div className={`p-4 ${showConsole ? 'flex flex-col h-full' : 'hidden'}`}>
              <div className="tabs tabs-boxed bg-base-200 p-1 mb-2">
                <button
                  className={`tab ${activeConsoleTab === 'run' ? 'tab-active' : ''}`}
                  onClick={() => setActiveConsoleTab('run')}
                >
                  Run Results
                </button>
                <button
                  className={`tab ${activeConsoleTab === 'submit' ? 'tab-active' : ''}`}
                  onClick={() => setActiveConsoleTab('submit')}
                >
                  Submission Results
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-base-100 p-4 rounded-lg shadow-inner">
                {/* Run Result Content */}
                {activeConsoleTab === 'run' && (
                  <div>
                    <h3 className="font-semibold mb-2">Test Case Results</h3>
                    {runResult ? (
                      <div>
                        {runResult.success ? (
                          <div className="alert alert-success p-2 mb-4">
                            <h4 className="font-bold">✅ All test cases passed!</h4>
                          </div>
                        ) : (
                          <div className="alert alert-error p-2 mb-4">
                            <h4 className="font-bold">❌ Error or Failed Test Cases</h4>
                          </div>
                        )}
                        <p className="text-sm">Runtime: {runResult.runtime || 'N/A'} sec</p>
                        <p className="text-sm mb-4">Memory: {runResult.memory || 'N/A'} KB</p>
                        <div className="space-y-4">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className="bg-base-200 p-3 rounded text-xs font-mono">
                              <div><strong>Input:</strong> {tc.stdin}</div>
                              <div><strong>Expected:</strong> {tc.expected_output}</div>
                              <div><strong>Your Output:</strong> {tc.stdout}</div>
                              <div className={`font-semibold ${tc.status_id === 3 ? 'text-success' : 'text-error'}`}>
                                {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Click "Run" to test your code.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Submit Result Content */}
                {activeConsoleTab === 'submit' && (
                  <div>
                    <h3 className="font-semibold mb-2">Submission Result</h3>
                    {submitResult ? (
                      <div className={`alert ${submitResult.accepted ? 'alert-success' : 'alert-error'} p-2`}>
                        {submitResult.accepted ? (
                          <div>
                            <h4 className="font-bold text-lg">🎉 Accepted</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                              <p>Runtime: {submitResult.runtime + " sec"}</p>
                              <p>Memory: {submitResult.memory + " KB"}</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-bold text-lg">❌ {submitResult.error || 'Failed'}</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Click "Submit" to see your submission results.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;