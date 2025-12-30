import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import UniversalScrollableText from "@/components/UniversalScrollableText";
import { ReactNode } from "react";

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string | ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  showAvatar?: boolean;
  avatarIcon?: ReactNode;
  avatarClassName?: string;
  className?: string;
}

export function ChatMessage({
  role,
  content,
  isLoading,
  isError,
  showAvatar = true,
  avatarIcon,
  avatarClassName,
  className,
}: ChatMessageProps) {
  const isUser = role === "user";

  const renderContent = () => {
    const textContent = typeof content === "string" ? (
      <span className="text-sm leading-relaxed">{content}</span>
    ) : (
      content
    );

    // All messages use horizontal scroll to prevent clipping
    return (
      <UniversalScrollableText>
        {textContent}
      </UniversalScrollableText>
    );
  };

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar for assistant */}
      {!isUser && showAvatar && (
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mr-2",
            isError
              ? "bg-destructive/20 text-destructive"
              : "bg-secondary text-secondary-foreground",
            avatarClassName
          )}
        >
          {avatarIcon || <Bot className="h-4 w-4" />}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "rounded-2xl px-3 py-2",
          isUser
            ? "bg-blue-500 text-white max-w-[85%]"
            : isError
            ? "bg-destructive/10 text-foreground border border-destructive/30 max-w-[70%] min-w-0"
            : "bg-slate-100 dark:bg-slate-800 text-foreground max-w-[70%] min-w-0",
          className
        )}
      >
        {isUser ? (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" style={{ maxWidth: '100%' }}>
            <span className="text-sm leading-relaxed whitespace-nowrap">
              {typeof content === "string" ? content : content}
            </span>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Avatar for user */}
      {isUser && showAvatar && (
        <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
