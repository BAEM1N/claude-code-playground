import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collaborativeEditorAPI } from '../../services/api';

interface Participant {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
}

interface Message {
  id: string;
  user_name: string;
  content: string;
  sent_at: string;
}

interface Session {
  id: string;
  title: string;
  language: string;
  created_by: string;
}

const CollaborativeEditor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState('');
  const [version, setVersion] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
    loadCode();
    loadParticipants();
    loadMessages();

    // Poll for updates
    const interval = setInterval(() => {
      loadCode();
      loadParticipants();
      loadMessages();
    }, 1000);

    return () => {
      interval && clearInterval(interval);
      // Leave session on unmount
      collaborativeEditorAPI.leaveSession(sessionId!).catch(() => {});
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await collaborativeEditorAPI.getSession(sessionId!);
      setSession(response.data);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCode = async () => {
    try {
      const response = await collaborativeEditorAPI.getCode(sessionId!);
      if (response.data.version > version) {
        setCode(response.data.code);
        setVersion(response.data.version);
      }
    } catch (error) {
      console.error('Failed to load code:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await collaborativeEditorAPI.getParticipants(sessionId!);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await collaborativeEditorAPI.getMessages(sessionId!);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    setCode(newCode);
    try {
      const response = await collaborativeEditorAPI.updateCode(sessionId!, newCode, version);
      setVersion(response.data.version);
    } catch (error) {
      console.error('Failed to update code:', error);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
      const response = await collaborativeEditorAPI.runCode(sessionId!);
      setOutput(response.data.output || 'No output');
    } catch (error) {
      setOutput('Error running code');
      console.error('Failed to run code:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await collaborativeEditorAPI.sendMessage(sessionId!, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await collaborativeEditorAPI.leaveSession(sessionId!);
      navigate('/collab-editor');
    } catch (error) {
      console.error('Failed to leave session:', error);
      navigate('/collab-editor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white font-semibold">{session?.title || 'Untitled'}</h1>
            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
              {session?.language}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Participants */}
            <div className="flex items-center space-x-2">
              {participants.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {participants.length > 5 && (
                <span className="text-gray-400 text-sm">+{participants.length - 5}</span>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-600"
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Chat
            </button>
            <button
              onClick={handleLeave}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="absolute inset-0 w-full h-full bg-gray-900 text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none"
              placeholder="// Start coding..."
              spellCheck={false}
            />

            {/* Participant cursors would be rendered here */}
            {participants.map((p) =>
              p.cursor ? (
                <div
                  key={p.id}
                  className="absolute w-0.5 h-5 pointer-events-none"
                  style={{
                    backgroundColor: p.color,
                    left: `${p.cursor.column * 8}px`,
                    top: `${p.cursor.line * 20}px`,
                  }}
                  title={p.name}
                />
              ) : null
            )}
          </div>

          {/* Output */}
          <div className="h-40 bg-black border-t border-gray-700">
            <div className="px-4 py-2 bg-gray-800 text-gray-400 text-sm border-b border-gray-700">
              Output
            </div>
            <div className="p-4 text-green-400 font-mono text-sm overflow-auto h-28">
              <pre>{output || 'Click "Run" to execute code'}</pre>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h2 className="text-white font-semibold">Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-blue-400 font-medium">{msg.user_name}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(msg.sent_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;
