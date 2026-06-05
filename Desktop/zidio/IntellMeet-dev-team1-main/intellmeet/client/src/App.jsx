import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import api from './utils/api';

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

  // Track currently active meeting room details
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Session gate: Redirect unauthenticated requests to the Login page
  useEffect(() => {
    const privateViews = ['dashboard', 'lobby', 'room'];
    if (privateViews.includes(view) && !currentUser) {
      setView('login');
    }
  }, [view, currentUser]);

  // Sync profile details with database on start if tokens exist
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('intellmeet_access_token');
      if (token && currentUser) {
        try {
          const res = await api.get('/auth/me');
          const verifiedUser = {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: res.data.user.role,
            avatar: res.data.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          };
          setCurrentUser(verifiedUser);
          localStorage.setItem('intellmeet_user', JSON.stringify(verifiedUser));
        } catch (err) {
          console.warn('Session verification failed. Token might be expired.', err);
          // Api client handles clearing on hard 401, but we can fallback here if needed
        }
      }
    };
    verifySession();
  }, []);

  const handleNavigate = (targetView, meetingData = null) => {
    if (meetingData) {
      setActiveMeeting(meetingData);
    }
    // If explicitly navigating back to landing or login (logout action), clear the stored session
    if (targetView === 'landing' || targetView === 'login') {
      api.clearTokens();
      setCurrentUser(null);
      setActiveMeeting(null);
    }
    setView(targetView);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = ({ user, tokens }) => {
    api.setTokens(tokens.accessToken, tokens.refreshToken);
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    const formattedUser = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role || "Member",
      avatar: initials || "U"
    };
    
    setCurrentUser(formattedUser);
    try {
      localStorage.setItem('intellmeet_user', JSON.stringify(formattedUser));
    } catch (e) {
      console.error('Failed to save user session in localStorage', e);
    }
    handleNavigate('dashboard');
  };

  const handleSignupSuccess = ({ user, tokens }) => {
    api.setTokens(tokens.accessToken, tokens.refreshToken);
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    const formattedUser = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role || "Member",
      avatar: initials || "U"
    };

    setCurrentUser(formattedUser);
    try {
      localStorage.setItem('intellmeet_user', JSON.stringify(formattedUser));
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
    return <Lobby onNavigate={handleNavigate} user={currentUser} meeting={activeMeeting} />;
  }

  if (view === 'room') {
    return <Room onNavigate={handleNavigate} user={currentUser} meeting={activeMeeting} />;
  }

  if (view === 'dashboard') {
    return <Dashboard onNavigate={handleNavigate} user={currentUser} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;