/**
 * WebSocket service for real-time communication
 */

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.courseId = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to WebSocket
   */
  connect(courseId, token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.courseId = courseId;
    const wsUrl = `${WS_URL}/ws/${courseId}?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected');
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      if (this.courseId && token) {
        this.connect(this.courseId, token);
      }
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(type, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message = JSON.stringify({ type, data });
    this.ws.send(message);
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const { type, data } = message;

    // Emit to all listeners for this event type
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(callback => callback(data));

    // Also emit to 'message' listeners
    const messageListeners = this.listeners.get('message') || [];
    messageListeners.forEach(callback => callback(message));
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  /**
   * Send message to channel
   */
  sendMessage(channelId, content, parentMessageId = null) {
    this.send('message.send', {
      channel_id: channelId,
      content,
      parent_message_id: parentMessageId,
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(channelId) {
    this.send('message.typing', {
      channel_id: channelId,
    });
  }

  /**
   * Add reaction to message
   */
  addReaction(messageId, emoji) {
    this.send('message.reaction', {
      message_id: messageId,
      emoji,
    });
  }

  /**
   * Send ping
   */
  ping() {
    this.send('ping', {});
  }
}

// Export singleton instance
const wsService = new WebSocketService();
export default wsService;
