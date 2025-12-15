import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ExternalLink, X } from 'lucide-react';
import { CrossModuleLink, useGlobalSession } from '@/contexts/GlobalSessionContext';

interface CrossModuleNavigatorProps {
  link: CrossModuleLink;
  onDismiss: () => void;
  currentModuleId: string;
}

const CrossModuleNavigator = ({ link, onDismiss, currentModuleId }: CrossModuleNavigatorProps) => {
  const navigate = useNavigate();
  const { updateSharedContext, sharedContext } = useGlobalSession();
  
  if (link.targetModuleId === currentModuleId) {
    return null;
  }

  const handleNavigate = () => {
    // Preserve context before navigating
    if (link.preserveContext) {
      updateSharedContext({
        ...sharedContext,
        recentTopics: [...sharedContext.recentTopics, `Switched from ${currentModuleId} to ${link.targetModuleId}`]
      });
    }
    
    // Navigate to target module
    navigate(`/${link.targetModuleId}`);
    onDismiss();
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 animate-in slide-in-from-top-2">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary">
              Cross-Module
            </Badge>
            <span className="text-xs text-muted-foreground">
              {link.reason}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              onClick={handleNavigate}
            >
              Go to {link.targetModuleName}
              <ArrowRight className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {link.preserveContext && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Your conversation context will be preserved
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CrossModuleNavigator;
