/**
 * Team Message Input Component
 * Input field for sending team messages
 */
import React, { useState, useRef, KeyboardEvent } from 'react';

interface TeamMessageInputProps {
  onSend: (content: string, metadata?: any) => void;
  placeholder?: string;
}

const TeamMessageInput: React.FC<TeamMessageInputProps> = ({
  onSend,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    try {
      await onSend(trimmedMessage);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2">
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={1}
          style={{ minHeight: '48px', maxHeight: '200px' }}
          disabled={isSending}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors ${
          message.trim() && !isSending
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSending ? (
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default TeamMessageInput;
