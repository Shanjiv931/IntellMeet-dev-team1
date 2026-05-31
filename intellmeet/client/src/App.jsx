import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

function App() {
  // Initialize user state from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('intellmeet_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse saved user from localStorage', e);
      return null;
    }
  });

  // Initialize view based on user session status
  const [view, setView] = useState(() => {
    try {
      const savedUser = localStorage.getItem('intellmeet_user');
      return savedUser ? 'dashboard' : 'landing';
    } catch (e) {
      return 'landing';
    }
  });

  // Session gate: Redirect unauthenticated requests to the Login page
  useEffect(() => {
    const privateViews = ['dashboard', 'lobby', 'room'];
    if (privateViews.includes(view) && !currentUser) {
      setView('login');
    }
  }, [view, currentUser]);

  const handleNavigate = (targetView) => {
    // If explicitly navigating back to landing or login (logout action), clear the stored session
    if (targetView === 'landing' || targetView === 'login') {
      try {
        localStorage.removeItem('intellmeet_user');
      } catch (e) {
        console.error('Failed to remove user from localStorage', e);
      }
      setCurrentUser(null);
    }
    setView(targetView);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = ({ email }) => {
    const prefix = email.split('@')[0];
    const formattedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const user = {
      name: formattedName,
      role: "Member",
      avatar: formattedName.slice(0, 2).toUpperCase()
    };
    
    setCurrentUser(user);
    try {
      localStorage.setItem('intellmeet_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session in localStorage', e);
    }
    handleNavigate('dashboard');
  };

  const handleSignupSuccess = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const user = {
      name: name,
      role: "Member",
      avatar: initials || "U"
    };

    setCurrentUser(user);
    try {
      localStorage.setItem('intellmeet_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session in localStorage', e);
    }
    handleNavigate('dashboard');
  };

  if (view === 'login') {
    return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'signup') {
    return <Signup onNavigate={handleNavigate} onSignupSuccess={handleSignupSuccess} />;
  }

  if (view === 'lobby') {
    return <Lobby onNavigate={handleNavigate} user={currentUser} />;
  }

  if (view === 'room') {
    return <Room onNavigate={handleNavigate} user={currentUser} />;
  }

  if (view === 'dashboard') {
    return <Dashboard onNavigate={handleNavigate} user={currentUser} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;