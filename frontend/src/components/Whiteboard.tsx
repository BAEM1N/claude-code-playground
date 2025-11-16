import React, { useRef, useState, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
}

interface WhiteboardProps {
  classroomId: number;
  onStroke: (stroke: Stroke, order: number) => void;
  onClear: () => void;
  readOnly?: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  classroomId: _classroomId,
  onStroke,
  onClear,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter'>('pen');
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [strokeOrder, setStrokeOrder] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.3;
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();

    // Reset
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    setCurrentStroke([pos]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const pos = getMousePos(e);
    setCurrentStroke((prev) => [...prev, pos]);

    // Draw current stroke in real-time
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || currentStroke.length === 0) return;

    const tempStroke: Stroke = {
      points: [...currentStroke, pos],
      color,
      width,
      tool,
    };

    redrawCanvas();
    drawStroke(ctx, tempStroke);
  };

  const handleMouseUp = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        points: currentStroke,
        color,
        width,
        tool,
      };

      // Add to local strokes
      setStrokes((prev) => [...prev, newStroke]);

      // Send to server
      const newOrder = strokeOrder + 1;
      setStrokeOrder(newOrder);
      onStroke(newStroke, newOrder);
    }

    setCurrentStroke([]);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getTouchPos(e);
    setCurrentStroke([pos]);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const pos = getTouchPos(e);
    setCurrentStroke((prev) => [...prev, pos]);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || currentStroke.length === 0) return;

    const tempStroke: Stroke = {
      points: [...currentStroke, pos],
      color,
      width,
      tool,
    };

    redrawCanvas();
    drawStroke(ctx, tempStroke);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handleClear = () => {
    setStrokes([]);
    setStrokeOrder(0);
    onClear();
  };

  // Public method to add external stroke (from WebSocket)
  // Note: This would be exposed via useImperativeHandle if component used forwardRef
  /*
  const addStroke = (stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke]);
  };

  React.useImperativeHandle(
    ref,
    () => ({
      addStroke,
      clearCanvas: handleClear,
    })
  );
  */

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-4 p-3 bg-gray-100 border-b border-gray-200">
          {/* Tool selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded ${
                tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
              }`}
              title="Pen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>

            <button
              onClick={() => setTool('highlighter')}
              className={`p-2 rounded ${
                tool === 'highlighter' ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700'
              }`}
              title="Highlighter"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10M3 21h1m13 0h1m-11-4l4-4m0 0l4-4m-4 4l-4-4m4 4l4 4"
                />
              </svg>
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded ${
                tool === 'eraser' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
              }`}
              title="Eraser"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Color picker */}
          {tool !== 'eraser' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          )}

          {/* Width selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Width:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{width}px</span>
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ cursor: readOnly ? 'default' : 'crosshair' }}
        />
      </div>

      {readOnly && (
        <div className="absolute top-2 right-2 px-3 py-1 bg-gray-900 bg-opacity-75 text-white text-sm rounded">
          Read Only
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
