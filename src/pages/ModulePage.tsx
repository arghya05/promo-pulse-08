import { useLocation } from 'react-router-dom';
import Index from './Index';

// This component wraps Index.tsx and passes the moduleId based on the current route
const ModulePage = () => {
  const location = useLocation();
  
  // Extract moduleId from path (e.g., /pricing -> pricing)
  const moduleId = location.pathname.replace('/', '') || 'promotion';

  return <Index moduleId={moduleId} />;
};

export default ModulePage;
