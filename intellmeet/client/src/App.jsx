import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'signup', or 'dashboard'
  const [currentUser, setCurrentUser] = useState({ name: "Product Manager", role: "Team Member", avatar: "PM" });

  const handleNavigate = (targetView) => {
    setView(targetView);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = ({ email }) => {
    const prefix = email.split('@')[0];
    const formattedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    setCurrentUser({
      name: formattedName,
      role: "Member",
      avatar: formattedName.slice(0, 2).toUpperCase()
    });
    handleNavigate('dashboard');
  };

  const handleSignupSuccess = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setCurrentUser({
      name: name,
      role: "Member",
      avatar: initials || "U"
    });
    handleNavigate('dashboard');
  };

  if (view === 'login') {
    return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'signup') {
    return <Signup onNavigate={handleNavigate} onSignupSuccess={handleSignupSuccess} />;
  }

  if (view === 'dashboard') {
    return <Dashboard onNavigate={handleNavigate} user={currentUser} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;