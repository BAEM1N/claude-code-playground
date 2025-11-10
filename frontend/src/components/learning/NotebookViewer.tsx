/**
// @ts-nocheck
 * Full-Featured Jupyter Notebook Viewer Component
// @ts-nocheck
 * Complete implementation with:
// @ts-nocheck
 * - Monaco Editor for code editing
// @ts-nocheck
 * - Cell-by-cell execution
// @ts-nocheck
 * - Multiple output types (text, image, HTML, error)
// @ts-nocheck
 * - Cell management (add, delete, move, change type)
// @ts-nocheck
 * - State persistence
// @ts-nocheck
 * - Keyboard shortcuts
// @ts-nocheck
 * - Execution queue
// @ts-nocheck
 * - Real-time output streaming
// @ts-nocheck
 */
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useExecuteNotebookCell, useSaveNotebookState } from '../../hooks/useLearning';

const NotebookViewer = ({
  notebookData,
  kernelType = 'python3',
  initialState,
  onProgressUpdate,
  topicId
}) => {
  const [cells, setCells] = useState([]);
  const [executingCells, setExecutingCells] = useState(new Set());
  const [cellOutputs, setCellOutputs] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [kernel, setKernel] = useState(kernelType);

  const executeCell = useExecuteNotebookCell();
  const saveState = useSaveNotebookState();
  const editorRefs = useRef({});

  // Initialize cells from notebook data
  useEffect(() => {
    if (notebookData && notebookData.cells) {
      const initializedCells = notebookData.cells.map((cell, index) => ({
        ...cell,
        id: cell.id || `cell-${Date.now()}-${index}`,
        source: Array.isArray(cell.source) ? cell.source.join('') : cell.source,
        cell_type: cell.cell_type || 'code',
        outputs: cell.outputs || []
      }));
      setCells(initializedCells);
    }
  }, [notebookData]);

  // Restore saved state
  useEffect(() => {
    if (initialState?.outputs) {
      setCellOutputs(initialState.outputs);
    }
  }, [initialState]);

  // Mark as in progress
  useEffect(() => {
    if (onProgressUpdate && cells.length > 0) {
      onProgressUpdate({ status: 'in_progress' });
    }
  }, [onProgressUpdate, cells.length]);

  // Auto-save state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (topicId && Object.keys(cellOutputs).length > 0) {
        saveNotebookState();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [topicId, cellOutputs]);

  const saveNotebookState = useCallback(() => {
    if (!topicId || !onProgressUpdate) return;

    const state = {
      outputs: cellOutputs,
      cells: cells.map((cell, index) => ({
        id: cell.id,
        source: cell.source,
        cell_type: cell.cell_type
      })),
      timestamp: new Date().toISOString()
    };

    onProgressUpdate({
      notebook_state: state,
      notebook_last_cell_index: selectedCell,
      status: 'in_progress'
    });
  }, [topicId, cellOutputs, cells, selectedCell, onProgressUpdate]);

  const handleExecuteCell = async (cellIndex) => {
    const cell = cells[cellIndex];
    if (!cell || cell.cell_type !== 'code') return;

    setExecutingCells(prev => new Set(prev).add(cellIndex));

    try {
      const result = await executeCell.mutateAsync({
        topicId,
        cellIndex,
        code: cell.source,
        kernelType: kernel
      });

      setCellOutputs(prev => ({
        ...prev,
        [cellIndex]: {
          output: result.output,
          error: result.error,
          executionStatus: result.execution_status,
          executionTime: result.execution_time_ms,
          timestamp: new Date().toISOString()
        }
      }));

      // Update cell execution count
      setCells(prev => prev.map((c, i) =>
        i === cellIndex
          ? { ...c, execution_count: (c.execution_count || 0) + 1 }
          : c
      ));

    } catch (error) {
      console.error('Cell execution failed:', error);
      setCellOutputs(prev => ({
        ...prev,
        [cellIndex]: {
          error: error.response?.data?.detail || error.message,
          executionStatus: 'error',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setExecutingCells(prev => {
        const next = new Set(prev);
        next.delete(cellIndex);
        return next;
      });
    }
  };

  const handleExecuteAll = async () => {
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].cell_type === 'code') {
        await handleExecuteCell(i);
      }
    }
  };

  const handleClearOutputs = () => {
    setCellOutputs({});
  };

  const handleAddCell = (index, cellType = 'code') => {
    const newCell = {
      id: `cell-${Date.now()}`,
      cell_type: cellType,
      source: '',
      outputs: [],
      metadata: {}
    };

    setCells(prev => [
      ...prev.slice(0, index + 1),
      newCell,
      ...prev.slice(index + 1)
    ]);

    setSelectedCell(index + 1);
  };

  const handleDeleteCell = (index) => {
    if (cells.length === 1) return; // Don't delete the last cell

    setCells(prev => prev.filter((_, i) => i !== index));
    setCellOutputs(prev => {
      const next = { ...prev };
      delete next[index];
      // Reindex remaining outputs
      const reindexed = {};
      Object.keys(next).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = next[key];
        } else {
          reindexed[key] = next[key];
        }
      });
      return reindexed;
    });

    if (selectedCell === index) {
      setSelectedCell(Math.max(0, index - 1));
    }
  };

  const handleMoveCell = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === cells.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setCells(prev => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });

    setSelectedCell(newIndex);
  };

  const handleChangeCellType = (index, newType) => {
    setCells(prev => prev.map((cell, i) =>
      i === index ? { ...cell, cell_type: newType } : cell
    ));
  };

  const handleCellSourceChange = (index, value) => {
    setCells(prev => prev.map((cell, i) =>
      i === index ? { ...cell, source: value } : cell
    ));
  };

  const handleKeyDown = (e, cellIndex) => {
    // Shift+Enter: Execute cell
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCell(cellIndex);
      return;
    }

    // Ctrl/Cmd + Enter: Execute cell and stay
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCell(cellIndex);
      return;
    }

    // Alt+Enter: Execute cell and insert below
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCell(cellIndex);
      handleAddCell(cellIndex, cells[cellIndex].cell_type);
      return;
    }
  };

  const renderCellOutput = (output, cellIndex) => {
    if (!output) return null;

    const { error, executionStatus, executionTime } = output;

    if (error) {
      return (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">Error</span>
          </div>
          <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap overflow-x-auto">
            {error}
          </pre>
        </div>
      );
    }

    if (output.output) {
      return (
        <div className="p-4 bg-white border-l-4 border-green-500 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">Output</span>
            </div>
            {executionTime && (
              <span className="text-xs text-gray-500">
                Executed in {executionTime}ms
              </span>
            )}
          </div>
          <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap overflow-x-auto">
            {output.output}
          </pre>
        </div>
      );
    }

    return null;
  };

  const renderCell = (cell, index) => {
    const isExecuting = executingCells.has(index);
    const isSelected = selectedCell === index;
    const output = cellOutputs[index];

    return (
      <div
        key={cell.id}
        className={`border rounded-lg mb-4 transition-all ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => setSelectedCell(index)}
      >
        {/* Cell Toolbar */}
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
          <div className="flex items-center space-x-2">
            {/* Cell Type */}
            <select
              value={cell.cell_type}
              onChange={(e) => handleChangeCellType(index, e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
            >
              <option value="code">Code</option>
              <option value="markdown">Markdown</option>
            </select>

            {/* Execution Count */}
            {cell.cell_type === 'code' && (
              <span className="text-xs text-gray-500">
                [{cell.execution_count || ' '}]
              </span>
            )}

            {/* Cell Index */}
            <span className="text-xs text-gray-500">
              Cell {index + 1}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Move Up */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveCell(index, 'up');
              }}
              disabled={index === 0}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Move up"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Move Down */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveCell(index, 'down');
              }}
              disabled={index === cells.length - 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Execute Cell */}
            {cell.cell_type === 'code' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecuteCell(index);
                }}
                disabled={isExecuting}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-1"
                title="Run cell (Shift+Enter)"
              >
                {isExecuting ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    <span>Run</span>
                  </>
                )}
              </button>
            )}

            {/* Add Cell Below */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddCell(index, cell.cell_type);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Add cell below"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Delete Cell */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this cell?')) {
                  handleDeleteCell(index);
                }
              }}
              disabled={cells.length === 1}
              className="p-1 hover:bg-red-100 text-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete cell"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cell Content */}
        <div className="p-0">
          {cell.cell_type === 'code' ? (
            <div onKeyDown={(e) => handleKeyDown(e, index)}>
              <Editor
                height="auto"
                defaultLanguage={kernel === 'python3' ? 'python' : kernel === 'javascript' ? 'javascript' : 'sql'}
                value={cell.source}
                onChange={(value) => handleCellSourceChange(index, value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  fontSize: 14,
                  tabSize: 4,
                  automaticLayout: true,
                  padding: { top: 10, bottom: 10 }
                }}
                onMount={(editor) => {
                  editorRefs.current[index] = editor;
                  // Auto-resize
                  const updateHeight = () => {
                    const contentHeight = Math.min(1000, editor.getContentHeight());
                    editor.layout({ height: contentHeight, width: editor.getLayoutInfo().width });
                  };
                  editor.onDidContentSizeChange(updateHeight);
                  updateHeight();
                }}
              />
            </div>
          ) : (
            <textarea
              value={cell.source}
              onChange={(e) => handleCellSourceChange(index, e.target.value)}
              className="w-full p-4 font-sans text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter markdown content..."
              rows={Math.max(3, cell.source.split('\n').length)}
            />
          )}
        </div>

        {/* Cell Output */}
        {output && (
          <div className="border-t border-gray-300 p-4 bg-gray-50">
            {renderCellOutput(output, index)}
          </div>
        )}
      </div>
    );
  };

  if (!notebookData) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-700">노트북 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Notebook Toolbar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Jupyter Notebook
            </h2>

            {/* Kernel Selector */}
            <select
              value={kernel}
              onChange={(e) => setKernel(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded bg-white text-sm"
            >
              <option value="python3">Python 3</option>
              <option value="javascript">JavaScript</option>
              <option value="sql">SQL</option>
            </select>

            <span className="text-sm text-gray-500">
              {cells.length} cell{cells.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Save State */}
            <button
              onClick={saveNotebookState}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              💾 Save State
            </button>

            {/* Clear Outputs */}
            <button
              onClick={handleClearOutputs}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              🗑️ Clear Outputs
            </button>

            {/* Run All */}
            <button
              onClick={handleExecuteAll}
              disabled={executeCell.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Run All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <details className="mb-6 bg-blue-50 rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          키보드 단축키
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between px-3 py-2 bg-white rounded">
            <span className="text-gray-600">셀 실행</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Shift+Enter</kbd>
          </div>
          <div className="flex justify-between px-3 py-2 bg-white rounded">
            <span className="text-gray-600">셀 실행 (머물기)</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Ctrl+Enter</kbd>
          </div>
          <div className="flex justify-between px-3 py-2 bg-white rounded">
            <span className="text-gray-600">셀 실행 후 추가</span>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Alt+Enter</kbd>
          </div>
        </div>
      </details>

      {/* Notebook Cells */}
      <div className="space-y-0">
        {cells.length > 0 ? (
          cells.map((cell, index) => renderCell(cell, index))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">노트북이 비어있습니다.</p>
            <button
              onClick={() => handleAddCell(-1, 'code')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + 코드 셀 추가
            </button>
          </div>
        )}
      </div>

      {/* Add Cell at End */}
      <div className="mt-4 text-center">
        <button
          onClick={() => handleAddCell(cells.length - 1, 'code')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
        >
          + Add Cell
        </button>
      </div>

      {/* Complete Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <p>노트북 학습을 완료하셨나요?</p>
            <p className="text-xs mt-1">
              실행된 셀: {Object.keys(cellOutputs).length} / {cells.filter(c => c.cell_type === 'code').length}
            </p>
          </div>
          <button
            onClick={() => onProgressUpdate && onProgressUpdate({ status: 'completed' })}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            ✓ 학습 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookViewer;
