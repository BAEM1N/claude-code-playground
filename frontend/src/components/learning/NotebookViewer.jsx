/**
 * Jupyter Notebook Viewer Component
 * Interactive code execution with server-side Jupyter Kernel
 *
 * Phase 4 TODO:
 * - Install @nteract/notebook-render or similar
 * - Integrate Monaco Editor for code editing
 * - Connect to Jupyter Kernel Gateway via WebSocket
 * - Handle cell execution, outputs, errors
 * - Save execution state to backend
 */
import React, { useState, useEffect } from 'react';
import { useExecuteNotebookCell } from '../../hooks/useLearning';

const NotebookViewer = ({
  notebookData,
  kernelType = 'python3',
  initialState,
  onProgressUpdate
}) => {
  const [cells, setCells] = useState([]);
  const [executionOutputs, setExecutionOutputs] = useState({});
  const executeCell = useExecuteNotebookCell();

  // Parse notebook data
  useEffect(() => {
    if (notebookData && notebookData.cells) {
      setCells(notebookData.cells);
    }
  }, [notebookData]);

  // Restore saved state
  useEffect(() => {
    if (initialState) {
      setExecutionOutputs(initialState.outputs || {});
    }
  }, [initialState]);

  // Mark as in progress
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({ status: 'in_progress' });
    }
  }, [onProgressUpdate]);

  const handleExecuteCell = async (cellIndex, code) => {
    try {
      const result = await executeCell.mutateAsync({
        cellIndex,
        code,
        kernelType
      });

      setExecutionOutputs(prev => ({
        ...prev,
        [cellIndex]: result.output
      }));

      // Save state
      if (onProgressUpdate) {
        onProgressUpdate({
          notebook_state: {
            outputs: {
              ...executionOutputs,
              [cellIndex]: result.output
            }
          },
          notebook_last_cell_index: cellIndex,
          status: 'in_progress'
        });
      }
    } catch (error) {
      console.error('Cell execution failed:', error);
      setExecutionOutputs(prev => ({
        ...prev,
        [cellIndex]: `Error: ${error.message}`
      }));
    }
  };

  if (!notebookData) {
    return (
      <div className="p-6 text-center text-gray-500">
        노트북 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Phase 4 Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <span className="text-3xl mr-4">💻</span>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Jupyter Notebook 실습 환경
            </h3>
            <p className="text-blue-700 mb-3">
              이 기능은 Phase 4에서 완전히 구현될 예정입니다.
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>✓ 서버 사이드 코드 실행 (Jupyter Kernel Gateway)</li>
              <li>✓ Monaco Editor를 통한 코드 편집</li>
              <li>✓ 실시간 출력 및 에러 표시</li>
              <li>✓ 셀 실행 상태 저장</li>
              <li>✓ Python, JavaScript, SQL 등 다중 커널 지원</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notebook Metadata */}
      {notebookData.metadata && (
        <div className="mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Kernel: {notebookData.metadata.kernelspec?.display_name || kernelType}</span>
            <span>Language: {notebookData.metadata.language_info?.name || 'python'}</span>
          </div>
        </div>
      )}

      {/* Notebook Cells Preview */}
      <div className="space-y-4">
        {cells.length > 0 ? (
          cells.map((cell, index) => (
            <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              {/* Cell Header */}
              <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
                <span className="text-sm font-medium text-gray-700">
                  {cell.cell_type === 'code' ? `코드 [${index + 1}]` : '마크다운'}
                </span>
                {cell.cell_type === 'code' && (
                  <button
                    onClick={() => handleExecuteCell(index, cell.source.join(''))}
                    disabled={executeCell.isLoading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {executeCell.isLoading ? '실행 중...' : '▶ 실행 (구현 예정)'}
                  </button>
                )}
              </div>

              {/* Cell Content */}
              <div className="p-4">
                {cell.cell_type === 'markdown' ? (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {Array.isArray(cell.source) ? cell.source.join('') : cell.source}
                    </div>
                  </div>
                ) : (
                  <div>
                    <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                      <code className="text-sm font-mono">
                        {Array.isArray(cell.source) ? cell.source.join('') : cell.source}
                      </code>
                    </pre>

                    {/* Output */}
                    {executionOutputs[index] && (
                      <div className="mt-3 p-3 bg-white border-l-4 border-green-500 rounded">
                        <div className="text-xs text-gray-500 mb-1">출력:</div>
                        <pre className="text-sm font-mono text-gray-800">
                          {executionOutputs[index]}
                        </pre>
                      </div>
                    )}

                    {/* Original outputs (if any) */}
                    {cell.outputs && cell.outputs.length > 0 && (
                      <div className="mt-3 p-3 bg-white border-l-4 border-blue-500 rounded">
                        <div className="text-xs text-gray-500 mb-1">원본 출력:</div>
                        <pre className="text-sm font-mono text-gray-800">
                          {JSON.stringify(cell.outputs, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            노트북 셀이 없습니다.
          </div>
        )}
      </div>

      {/* Complete button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => onProgressUpdate && onProgressUpdate({ status: 'completed' })}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          ✓ 학습 완료
        </button>
      </div>

      {/* Debug: Show notebook data structure */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-gray-100 rounded">
          <summary className="cursor-pointer font-medium text-gray-700">
            노트북 데이터 구조 (개발 전용)
          </summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(notebookData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default NotebookViewer;
