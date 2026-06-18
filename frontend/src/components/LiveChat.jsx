import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { chatApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Icon, ICON } from './ui/Icon';

const SESSION_KEY = 'stayease_chat_session';

const HIDDEN_PATHS = ['/login', '/register', '/forgot-password'];
const HIDDEN_PATH_PREFIXES = ['/host/listings/setup', '/host/rooms/add'];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm StayEase Assistant. Ask about bookings, cancellations, fees, hosting, or tell me where you'd like to go.",
  at: null,
};

const DEFAULT_QUICK_REPLIES = ['Browse stays', 'My bookings', 'Help centre', 'Become a host'];

function getDefaultQuickReplies(user) {
  if (user?.role === 'host') {
    return ['Host dashboard', 'My listings', 'Guest messages', 'Help centre'];
  }
  if (user) {
    return ['Browse stays', 'My bookings', 'Wishlist', 'Help centre'];
  }
  return DEFAULT_QUICK_REPLIES;
}

function getStoredSessionId() {
  return localStorage.getItem(SESSION_KEY) || '';
}

function storeSessionId(id) {
  if (id) localStorage.setItem(SESSION_KEY, id);
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`live-chat__bubble-row${isUser ? ' live-chat__bubble-row--user' : ''}`}>
      {!isUser && <div className="live-chat__avatar" aria-hidden>SE</div>}
      <div className={`live-chat__bubble${isUser ? ' live-chat__bubble--user' : ''}`}>
        <p>{message.content}</p>
        {message.at && <time className="live-chat__time">{formatTime(message.at)}</time>}
      </div>
    </div>
  );
}

export default function LiveChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(getStoredSessionId);
  const [quickReplies, setQuickReplies] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const hidden = HIDDEN_PATHS.some((path) => location.pathname.startsWith(path))
    || HIDDEN_PATH_PREFIXES.some((path) => location.pathname.startsWith(path));

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, []);

  const applyResponse = useCallback((data) => {
    if (data.session_id) {
      setSessionId(data.session_id);
      storeSessionId(data.session_id);
    }
    if (Array.isArray(data.messages)) {
      setMessages(data.messages);
    }
    setQuickReplies(data.quick_replies || []);
    setActions(data.actions || []);
    scrollToBottom();
  }, [scrollToBottom]);

  const loadHistory = useCallback(async () => {
    const stored = getStoredSessionId();
    if (!stored) return false;
    try {
      const { data } = await chatApi.history(stored);
      if (data.messages?.length) {
        setMessages(data.messages);
        setSessionId(stored);
        scrollToBottom();
        return true;
      }
    } catch {
      // Fresh session if history unavailable
    }
    return false;
  }, [scrollToBottom]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    setInput('');
    setQuickReplies([]);
    setActions([]);
    setLoading(true);

    const optimistic = [
      ...messages,
      { role: 'user', content: trimmed, at: new Date().toISOString() },
    ];
    setMessages(optimistic);
    scrollToBottom();

    try {
      const { data } = await chatApi.send({
        message: trimmed,
        session_id: sessionId || undefined,
        current_path: location.pathname,
      });
      applyResponse(data);
    } catch (err) {
      setError(err.normalized?.message || 'Could not reach support assistant. Try again.');
      setMessages(messages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [applyResponse, loading, location.pathname, messages, scrollToBottom, sessionId]);

  const openChat = useCallback(async () => {
    setOpen(true);
    if (messages.length) return;

    setBootstrapping(true);
    const hasHistory = await loadHistory();
    if (!hasHistory) {
      setMessages([WELCOME_MESSAGE]);
      setQuickReplies(getDefaultQuickReplies(user));
    }
    setBootstrapping(false);
  }, [loadHistory, messages.length, user]);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [open, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
  };

  if (hidden) return null;

  return (
    <div className="live-chat no-print" data-open={open ? 'true' : 'false'}>
      {open && (
        <section className="live-chat__panel" aria-label="StayEase live chat">
          <header className="live-chat__header">
            <div>
              <h2 className="live-chat__title">StayEase Assistant</h2>
              <p className="live-chat__subtitle">Ask questions or get help navigating</p>
            </div>
            <button
              type="button"
              className="live-chat__icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <Icon icon={X} size={ICON.md} />
            </button>
          </header>

          <div className="live-chat__messages" ref={listRef}>
            {messages.map((msg, index) => (
              <ChatBubble key={`${msg.at || 'msg'}-${index}`} message={msg} />
            ))}
            {(loading || bootstrapping) && (
              <div className="live-chat__typing" aria-live="polite">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {!!actions.length && (
            <div className="live-chat__actions">
              {actions.map((action) => (
                <button
                  key={`${action.label}-${action.path}`}
                  type="button"
                  className="btn btn-outline btn-sm live-chat__action-btn"
                  onClick={() => handleNavigate(action.path)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {!!quickReplies.length && !loading && (
            <div className="live-chat__quick-replies">
              {quickReplies.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="live-chat__chip"
                  onClick={() => sendMessage(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="live-chat__error">{error}</p>}

          <form
            className="live-chat__composer"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="live-chat__input"
              placeholder="Ask about bookings, fees, hosting..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || bootstrapping}
              maxLength={1000}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="live-chat__send"
              disabled={!input.trim() || loading || bootstrapping}
              aria-label="Send message"
            >
              <Icon icon={Send} size={ICON.md} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="live-chat__launcher"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-expanded={open}
        aria-label={open ? 'Close StayEase Assistant' : 'Open StayEase Assistant'}
      >
        <Icon icon={open ? X : MessageCircle} size={ICON.lg} />
        {!open && <span className="live-chat__launcher-label">Chat</span>}
      </button>
    </div>
  );
}
