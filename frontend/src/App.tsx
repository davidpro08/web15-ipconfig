import { Routes, Route, Navigate } from 'react-router';
import WorkSpacePage from './pages/WorkSpacePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workspace" replace />} />
      <Route path="/workspace" element={<WorkSpacePage />} />
    </Routes>
  );
}

export default App;
