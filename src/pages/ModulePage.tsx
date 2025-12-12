import { useState, useMemo } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { getModuleById } from '@/lib/data/modules';
import { getQuestionsByModule, getPopularIdsByModule } from '@/lib/data/module-questions';
import { getKPIsByModule } from '@/lib/data/module-kpis';
import ModuleLayout from '@/components/ModuleLayout';
import ModuleChatInterface from '@/components/ModuleChatInterface';
import ModuleClassicView from '@/components/ModuleClassicView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, LayoutList } from 'lucide-react';

const ModulePage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'chat' | 'classic'>('chat');

  // Extract moduleId from path (e.g., /pricing -> pricing)
  const moduleId = location.pathname.replace('/', '');

  const module = useMemo(() => {
    if (!moduleId) return null;
    return getModuleById(moduleId);
  }, [moduleId]);

  const questions = useMemo(() => {
    if (!moduleId) return [];
    return getQuestionsByModule(moduleId);
  }, [moduleId]);

  const popularIds = useMemo(() => {
    if (!moduleId) return [];
    return getPopularIdsByModule(moduleId);
  }, [moduleId]);

  const kpis = useMemo(() => {
    if (!moduleId) return [];
    return getKPIsByModule(moduleId);
  }, [moduleId]);

  if (!module) {
    return <Navigate to="/" replace />;
  }

  const popularQuestions = questions.filter(q => popularIds.includes(q.id));

  return (
    <ModuleLayout module={module}>
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'classic')}>
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="chat" className="gap-2 px-6">
                <MessageSquare className="h-4 w-4" />
                Chat Assistant
              </TabsTrigger>
              <TabsTrigger value="classic" className="gap-2 px-6">
                <LayoutList className="h-4 w-4" />
                Classic View
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="mt-0">
            <ModuleChatInterface 
              module={module}
              questions={questions}
              popularQuestions={popularQuestions}
              kpis={kpis}
            />
          </TabsContent>

          <TabsContent value="classic" className="mt-0">
            <ModuleClassicView 
              module={module}
              questions={questions}
              popularQuestions={popularQuestions}
              kpis={kpis}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default ModulePage;
