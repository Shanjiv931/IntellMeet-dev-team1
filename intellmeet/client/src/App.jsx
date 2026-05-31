import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', or 'signup'

  const handleNavigate = (targetView) => {
    setView(targetView);
    window.scrollTo(0, 0);
  };

  if (view === 'login') {
    return <Login onNavigate={handleNavigate} />;
  }

  if (view === 'signup') {
    return <Signup onNavigate={handleNavigate} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;