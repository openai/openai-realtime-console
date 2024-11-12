import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LocationPage from './pages/LocationPage';
import ThemePage from './pages/ThemePage';
import ActivityGuidePage from './pages/ActivityGuidePage';
import { ConsolePage } from './pages/ConsolePage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LocationPage />} />
        <Route path="/themes" element={<ThemePage />} />
        <Route path="/activities" element={<ActivityGuidePage />} />
        <Route path="/console" element={<ConsolePage />} />
      </Routes>
    </Router>
  );
};

export default App;
