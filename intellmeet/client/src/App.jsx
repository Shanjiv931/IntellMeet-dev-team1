import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import api from './utils/api';

function App() {
  // Initialize user state from localStorage/sessionStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('intellmeet_user') || sessionStorage.getItem('intellmeet_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse saved user from storage', e);
      return null;
    }
  });

  // Initialize view based on user session status
  const [view, setView] = useState(() => {
    try {
      const savedUser = localStorage.getItem('intellmeet_user') || sessionStorage.getItem('intellmeet_user');
      return savedUser ? 'dashboard' : 'landing';
    } catch {
      return 'landing';
    }
  });

  // Track currently active meeting room details
  const [activeMeeting, setActiveMeeting] = useState(null);
  
  // Track email to pre-populate on registration redirect
  const [signupEmail, setSignupEmail] = useState('');

  // Track password reset token
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('intellmeet_theme') || 'light';
    // Map system preference to light theme directly to enforce light mode by default
    let activeTheme = savedTheme === 'system' ? 'light' : savedTheme;
    if (activeTheme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        setResetToken(token);
        setView('reset-password');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Failed to parse reset token from URL', e);
    }
  }, []);

  useEffect(() => {
    const privateViews = ['dashboard', 'lobby', 'room'];
    if (privateViews.includes(view) && !currentUser) {
      const timer = setTimeout(() => {
        setView('login');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [view, currentUser]);

  // Sync profile details with database on start if tokens exist
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('intellmeet_access_token') || sessionStorage.getItem('intellmeet_access_token');
      if (token && currentUser) {
        try {
          const res = await api.get('/auth/me');
          const initials = res.data.user.name ? res.data.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
          const verifiedUser = {
            id: res.data.user.id || res.data.user._id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: res.data.user.role,
            avatar: res.data.user.avatar || initials
          };
          setCurrentUser(verifiedUser);
          if (localStorage.getItem('intellmeet_access_token')) {
            localStorage.setItem('intellmeet_user', JSON.stringify(verifiedUser));
            sessionStorage.removeItem('intellmeet_user');
          } else {
            sessionStorage.setItem('intellmeet_user', JSON.stringify(verifiedUser));
            localStorage.removeItem('intellmeet_user');
          }
        } catch (err) {
          console.warn('Session verification failed. Token might be expired.', err);
        }
      }
    };
    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserUpdate = (updatedFields) => {
    if (!currentUser) return;
    const nameToUse = updatedFields.name !== undefined ? updatedFields.name : currentUser.name;
    const initials = nameToUse ? nameToUse.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    
    const newUserData = {
      ...currentUser,
      ...updatedFields,
      avatar: updatedFields.avatar !== undefined ? (updatedFields.avatar || initials) : currentUser.avatar
    };
    setCurrentUser(newUserData);
    
    try {
      if (localStorage.getItem('intellmeet_access_token')) {
        localStorage.setItem('intellmeet_user', JSON.stringify(newUserData));
      } else {
        sessionStorage.setItem('intellmeet_user', JSON.stringify(newUserData));
      }
    } catch (e) {
      console.error('Failed to sync updated user session in storage', e);
    }
  };

  const handleNavigate = (targetView, extraData = null) => {
    if (targetView === 'signup' && typeof extraData === 'string') {
      setSignupEmail(extraData);
    } else if (targetView !== 'signup') {
      setSignupEmail('');
    }

    if (targetView === 'reset-password' && typeof extraData === 'string') {
      setResetToken(extraData);
    } else if (targetView !== 'reset-password') {
      setResetToken('');
    }

    if (extraData && typeof extraData === 'object') {
      setActiveMeeting(extraData);
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

  const handleLoginSuccess = ({ user, tokens }, rememberMe = false) => {
    api.setTokens(tokens.accessToken, tokens.refreshToken, rememberMe);
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    const formattedUser = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role || "Member",
      avatar: user.avatar || initials || "U"
    };
    
    setCurrentUser(formattedUser);
    try {
      if (rememberMe) {
        localStorage.setItem('intellmeet_user', JSON.stringify(formattedUser));
        sessionStorage.removeItem('intellmeet_user');
      } else {
        sessionStorage.setItem('intellmeet_user', JSON.stringify(formattedUser));
        localStorage.removeItem('intellmeet_user');
      }
    } catch (e) {
      console.error('Failed to save user session in storage', e);
    }
    handleNavigate('dashboard');
  };
 
  const handleSignupSuccess = ({ user, tokens }) => {
    api.setTokens(tokens.accessToken, tokens.refreshToken, false);
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    const formattedUser = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role || "Member",
      avatar: user.avatar || initials || "U"
    };
 
    setCurrentUser(formattedUser);
    try {
      sessionStorage.setItem('intellmeet_user', JSON.stringify(formattedUser));
      localStorage.removeItem('intellmeet_user');
    } catch (e) {
      console.error('Failed to save user session in storage', e);
    }
    handleNavigate('dashboard');
  };

  if (view === 'login') {
    return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'signup') {
    return <Signup onNavigate={handleNavigate} onSignupSuccess={handleSignupSuccess} defaultEmail={signupEmail} />;
  }

  if (view === 'forgot-password') {
    return <ForgotPassword onNavigate={handleNavigate} />;
  }

  if (view === 'reset-password') {
    return <ResetPassword onNavigate={handleNavigate} token={resetToken} />;
  }

  if (view === 'lobby') {
    return <Lobby onNavigate={handleNavigate} user={currentUser} meeting={activeMeeting} />;
  }

  if (view === 'room') {
    return <Room onNavigate={handleNavigate} user={currentUser} meeting={activeMeeting} />;
  }

  if (view === 'dashboard') {
    return <Dashboard onNavigate={handleNavigate} user={currentUser} activeMeeting={activeMeeting} onUserUpdate={handleUserUpdate} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;