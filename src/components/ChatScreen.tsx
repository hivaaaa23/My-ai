import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ControlledActionSuggestion, ActiveScreen } from '../types/studymate';
import {
  Send,
  Bot,
  User,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatPersianDateString } from '../utils/persianDate';

interface ChatScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  onAddTaskFromChat: (taskTitle: string) => void;
  onExecuteControlledAction?: (action: ControlledActionSuggestion, messageId: string) => Promise<void>;
  onNavigate?: (screen: ActiveScreen) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onAddTaskFromChat,
  onExecuteControlledAction,
  onNavigate,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<Record<string, boolean>>({});
  const [dismissedActions, setDismissedActions] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setInputText('');
    setIsLoading(true);

    try {
      await onSendMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmAction = async (msgId: string, action: ControlledActionSuggestion) => {
    setActionProcessing((prev) => ({ ...prev, [msgId]: true }));
    try {
      if (onExecuteControlledAction) {
        await onExecuteControlledAction(action, msgId);
      } else {
        onAddTaskFromChat(action.title);
      }
    } finally {
      setActionProcessing((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const samplePrompts = [
    'فردا ۲۰ تست فیزیک اضافه کن',
    'امروز مدرسه گفت فصل ۱ حسابان رو بخونم و ۲۰ تا تست بزنم',
    'برنامه برای فردا بزار',
    'تسک‌های عقب‌افتاده رو بازتوزیع کن',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] pb-16 max-w-xl mx-auto">
      {/* Top Clean Advisor Info */}
      <div className="bg-white rounded-xl p-3 mb-2 shrink-0 flex items-center justify-between border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-reverse space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#9E1030] text-white flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-reverse space-x-1.5">
              <span className="text-xs font-bold text-slate-800">مشاور تخصصی یازدهم ریاضی</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </div>
            <p className="text-[11px] text-slate-500">
              ثبت مستقیم تسک و تکالیف، تحلیل مباحث و بازتوزیع برنامه
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={onClearChat}
            title="پاک‌کردن تاریخچه گفت‌وگو"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition text-xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const action = msg.actionSuggestion;
          const isDismissed = dismissedActions[msg.id];
          const isApplied = action?.status === 'applied';
          const isProcessing = actionProcessing[msg.id];

          return (
            <div
              key={msg.id}
              className="flex items-start space-x-reverse space-x-2"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-[#9E1030] text-white'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-tr-none shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.text}</div>

                {/* Controlled Action Notification Card */}
                {!isUser && action && !isDismissed && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                    {/* If Applied to Planner */}
                    {isApplied ? (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-reverse space-x-1.5 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">به برنامه اضافه شد: {action.title}</span>
                        </div>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('tasks')}
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded font-semibold flex items-center shrink-0 mr-1"
                          >
                            <span>مشاهده</span>
                            <ExternalLink className="w-3 h-3 mr-0.5" />
                          </button>
                        )}
                      </div>
                    ) : action.requiresConfirmation ? (
                      /* Confirmation Required Card */
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-2 text-[11px]">
                        <div className="flex items-center space-x-reverse space-x-1.5 text-amber-900 font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>نیاز به تأیید: {action.title}</span>
                        </div>

                        {action.description && (
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {action.description}
                          </p>
                        )}

                        {action.payload?.plan && (
                          <div className="bg-white rounded p-2 space-y-1 max-h-28 overflow-y-auto border border-amber-100">
                            {action.payload.plan.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-700 truncate max-w-[170px]">
                                  {item.taskTitle}
                                </span>
                                <span className="text-amber-700 font-medium">
                                  {formatPersianDateString(item.newDueDate)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-reverse space-x-2 pt-1">
                          <button
                            onClick={() => setDismissedActions((p) => ({ ...p, [msg.id]: true }))}
                            className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200/60 rounded"
                          >
                            صرف‌نظر
                          </button>
                          <button
                            onClick={() => handleConfirmAction(msg.id, action)}
                            disabled={isProcessing}
                            className="bg-[#9E1030] text-white px-2.5 py-1 rounded font-medium text-[11px] flex items-center space-x-reverse space-x-1 hover:bg-[#830B26]"
                          >
                            <Check className="w-3 h-3" />
                            <span>{isProcessing ? 'درحال ثبت...' : 'تأیید و اعمال'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Pending Single Action Card */
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                        <div className="text-slate-700 truncate max-w-[180px]">
                          <span className="font-semibold">{action.title}</span>
                        </div>

                        <button
                          onClick={() => handleConfirmAction(msg.id, action)}
                          disabled={isProcessing}
                          className="bg-[#9E1030] hover:bg-[#830B26] text-white px-2.5 py-1 rounded text-[10px] font-medium"
                        >
                          {isProcessing ? 'درحال ثبت...' : 'ثبت در برنامه'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 text-left ${
                    isUser ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#9E1030] text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center space-x-reverse space-x-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#9E1030] animate-pulse" />
              <span>مشاور در حال بررسی و برنامه‌ریزی...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length < 5 && (
        <div className="px-1 py-1.5 flex items-center space-x-reverse space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="pt-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-white rounded-xl p-1.5 flex items-center space-x-reverse space-x-2 border border-slate-200 shadow-xs"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="پیام یا تکلیف مدرسه (مثلاً: فردا ۲۰ تست فیزیک اضافه کن)..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-hidden"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-[#9E1030] hover:bg-[#830B26] text-white flex items-center justify-center disabled:opacity-40 transition shrink-0"
          >
            <Send className="w-3.5 h-3.5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
