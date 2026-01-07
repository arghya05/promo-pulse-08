import React, { useState } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessageData, ProcessedChatResponse } from './types';
import ExecutiveBriefCard from './ExecutiveBriefCard';
import DetailsAccordion from './DetailsAccordion';
import { processResponse } from './ResponsePostProcessor';
import { Button } from '@/components/ui/button';

interface ExecutiveChatMessageProps {
  message: ChatMessageData;
  onNextQuestion?: (question: string) => void;
  onClarificationSelect?: (refinedQuestion: string) => void;
  onDrillDown?: (item: { name: string; value: any; type?: string }) => void;
  isLoading?: boolean;
  moduleIcon?: React.ReactNode;
  moduleColor?: string;
  className?: string;
}

export const ExecutiveChatMessage: React.FC<ExecutiveChatMessageProps> = ({
  message,
  onNextQuestion,
  onClarificationSelect,
  onDrillDown,
  isLoading = false,
  moduleIcon,
  moduleColor = 'text-primary',
  className
}) => {
  const isUser = message.role === 'user';
  const [showDetails, setShowDetails] = useState(false);

  // Process the response if it's an assistant message with data
  const processedResponse: ProcessedChatResponse | null = React.useMemo(() => {
    if (isUser || message.isLoading || message.isError || message.clarificationOptions) {
      return null;
    }
    
    // Use pre-processed response if available, otherwise process raw data
    if (message.processedResponse) {
      return message.processedResponse;
    }
    
    if (message.rawData) {
      return processResponse(message.rawData, message.content);
    }
    
    // Process plain text content
    if (message.content) {
      return processResponse({ content: message.content, whatHappened: [message.content] }, '');
    }
    
    return null;
  }, [message, isUser]);

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start", className)}>
      {/* Avatar for assistant */}
      {!isUser && (
        <div className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2",
          message.isError
            ? "bg-destructive/20 text-destructive"
            : "bg-secondary text-secondary-foreground"
        )}>
          {moduleIcon || <Bot className="h-3.5 w-3.5" />}
        </div>
      )}

      {/* Message Content */}
      <div className={isUser ? "max-w-[75%]" : "max-w-[90%] min-w-0"}>
        {isUser ? (
          // User message bubble
          <div className="bg-blue-500 text-white rounded-2xl px-3 py-2">
            <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </span>
          </div>
        ) : message.isLoading ? (
          // Loading state
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Analyzing...</span>
          </div>
        ) : message.isError ? (
          // Error state
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-3 py-2.5">
            <p className="text-xs text-destructive whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        ) : message.clarificationOptions ? (
          // Clarification options
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2.5 space-y-2">
            <p className="text-xs font-medium">{message.content}</p>
            <div className="flex flex-wrap gap-1.5">
              {message.clarificationOptions.map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1.5 px-2 text-left hover:bg-primary/10 hover:border-primary"
                  onClick={() => onClarificationSelect?.(option.refinedQuestion)}
                  disabled={isLoading}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-xs">{option.label}</span>
                    <span className="text-[10px] text-muted-foreground">{option.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ) : processedResponse ? (
          // Executive Brief + Details Accordion (collapsed by default)
          <div className="space-y-1.5">
            <ExecutiveBriefCard
              brief={processedResponse.brief}
              onNextQuestion={onNextQuestion}
              isLoading={isLoading}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails(!showDetails)}
            />
            {showDetails && <DetailsAccordion details={processedResponse.details} onDrillDown={onDrillDown} />}
          </div>
        ) : (
          // Fallback plain text
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2.5">
            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ml-2 bg-primary/10">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
    </div>
  );
};

export default ExecutiveChatMessage;