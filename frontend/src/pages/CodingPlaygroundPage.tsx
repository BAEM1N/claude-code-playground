// @ts-nocheck
import React, { useState } from 'react';
import { codingAPI } from '../services/api';
import { ProgrammingLanguage, ExecutionStatus } from '../types/coding';

const LANGUAGE_TEMPLATES = {
  python: `def hello():
    print("Hello, World!")

hello()`,
  javascript: `function hello() {
    console.log("Hello, World!");
}

hello();`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
};

const CodingPlaygroundPage: React.FC = () => {
  const [language, setLanguage] = useState<ProgrammingLanguage>(ProgrammingLanguage.PYTHON);
  const [code, setCode] = useState<string>(LANGUAGE_TEMPLATES.python);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    setCode(LANGUAGE_TEMPLATES[newLang] || '');
    setOutput('');
    setError('');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    setExecutionTime(null);

    try {
      const { data } = await codingAPI.executeCode({
        code,
        language,
        input_data: input || undefined,
      });

      if (data.status === ExecutionStatus.SUCCESS) {
        setOutput(data.output || '');
        if (data.error) {
          setError(data.error);
        }
      } else if (data.status === ExecutionStatus.ERROR) {
        setError(data.error || 'Execution error');
      } else if (data.status === ExecutionStatus.TIMEOUT) {
        setError('Execution timeout');
      }

      setExecutionTime(data.execution_time);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">코딩 플레이그라운드</h1>
          <p className="mt-2 text-gray-600">온라인에서 코드를 작성하고 실행해보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Code Editor */}
          <div className="space-y-4">
            {/* Language Selector */}
            <div className="bg-white rounded-lg shadow p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">프로그래밍 언어</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={ProgrammingLanguage.PYTHON}>Python</option>
                <option value={ProgrammingLanguage.JAVASCRIPT}>JavaScript</option>
                <option value={ProgrammingLanguage.JAVA}>Java</option>
                <option value={ProgrammingLanguage.CPP}>C++</option>
                <option value={ProgrammingLanguage.C}>C</option>
              </select>
            </div>

            {/* Code Editor */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">코드 에디터</h3>
              </div>
              <div className="p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="코드를 입력하세요..."
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Input */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">표준 입력 (stdin)</h3>
              </div>
              <div className="p-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-24 px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="프로그램 입력값 (선택사항)"
                />
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isRunning || !code.trim()}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  실행 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  실행하기
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-4">
            {/* Output */}
            <div className="bg-white rounded-lg shadow h-full">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">실행 결과</h3>
                {executionTime !== null && (
                  <span className="text-xs text-gray-500">
                    실행 시간: {executionTime.toFixed(2)}ms
                  </span>
                )}
              </div>
              <div className="p-4">
                {output && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-green-700 mb-2">✓ 출력:</h4>
                    <pre className="bg-green-50 border border-green-200 rounded p-3 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
                      {output}
                    </pre>
                  </div>
                )}

                {error && (
                  <div>
                    <h4 className="text-xs font-medium text-red-700 mb-2">✗ 에러:</h4>
                    <pre className="bg-red-50 border border-red-200 rounded p-3 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96 text-red-600">
                      {error}
                    </pre>
                  </div>
                )}

                {!output && !error && !isRunning && (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>코드를 실행하면 결과가 여기에 표시됩니다</p>
                  </div>
                )}

                {isRunning && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p>코드를 실행하는 중...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 팁</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Python의 경우 print() 함수로 출력하세요</li>
                <li>• JavaScript의 경우 console.log()를 사용하세요</li>
                <li>• 표준 입력을 사용하려면 아래 입력 창에 데이터를 넣으세요</li>
                <li>• 실행 시간 제한: 5초</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPlaygroundPage;
