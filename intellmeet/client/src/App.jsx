import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'login'

  const handleNavigate = (targetView) => {
    setView(targetView);
    window.scrollTo(0, 0);
  };

  if (view === 'login') {
    return <Login onNavigate={handleNavigate} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;