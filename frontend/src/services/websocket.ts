/**
 * WebSocket service for real-time communication
 */

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export type WebSocketMessageType =
  | 'message.send'
  | 'message.typing'
  | 'message.reaction'
  | 'ping'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'message';

export interface WebSocketMessage {
  type: string;
  data?: any;
}

export type WebSocketEventCallback = (data?: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private courseId: string | null = null;
  private listeners: Map<string, WebSocketEventCallback[]> = new Map();
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 1000;

  /**
   * Connect to WebSocket
   * Token is no longer passed in URL for better security.
   * Instead, it's sent in the first message after connection.
   */
  connect(courseId: string, token: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.courseId = courseId;
    // Removed token from URL to prevent exposure in logs
    const wsUrl = `${WS_URL}/ws/${courseId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (): void => {
        console.log('WebSocket connection opened, sending authentication...');

        // Send authentication as first message (more secure than URL parameter)
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      this.ws.onmessage = (event: MessageEvent): void => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle authentication response
          if (message.type === 'auth_success') {
            console.log('WebSocket authenticated successfully');
            this.reconnectAttempts = 0;
            this.emit('connected');
            return;
          }

          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error: Event): void => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = (): void => {
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
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );

    setTimeout(() => {
      if (this.courseId && token) {
        this.connect(this.courseId, token);
      }
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, data?: any): void {
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
  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message;

    // Emit to all listeners for this event type
    const listeners = this.listeners.get(type) || [];
    listeners.forEach((callback) => callback(data));

    // Also emit to 'message' listeners
    const messageListeners = this.listeners.get('message') || [];
    messageListeners.forEach((callback) => callback(message));
  }

  /**
   * Add event listener
   */
  on(event: string, callback: WebSocketEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: WebSocketEventCallback): void {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event)!;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }

  /**
   * Send message to channel
   */
  sendMessage(channelId: string, content: string, parentMessageId: string | null = null): void {
    this.send('message.send', {
      channel_id: channelId,
      content,
      parent_message_id: parentMessageId,
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(channelId: string): void {
    this.send('message.typing', {
      channel_id: channelId,
    });
  }

  /**
   * Add reaction to message
   */
  addReaction(messageId: string, emoji: string): void {
    this.send('message.reaction', {
      message_id: messageId,
      emoji,
    });
  }

  /**
   * Send ping
   */
  ping(): void {
    this.send('ping', {});
  }
}

// Export singleton instance
const wsService = new WebSocketService();
export default wsService;
