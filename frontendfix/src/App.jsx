import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import socketService from './socket';

// Import components
import Navbar from './components/Navbar';

// Import pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import CodeEditorPage from './pages/CodeEditorPage';
import MeetingRoom from './pages/MeetingRoom';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
};

// Teacher-only Route Component
const TeacherRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  if (user?.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

function App() {
  const { isAuthenticated, user, token, initializeAuth } = useAuthStore();

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <div className="App">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          } 
        />
        <Route 
          path="/signin" 
          element={
            <PageTransition>
              <SignIn />
            </PageTransition>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PageTransition>
              <SignUp />
            </PageTransition>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/editor/:roomCode" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <CodeEditorPage />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/meeting/:roomCode" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <MeetingRoom />
              </PageTransition>
            </ProtectedRoute>
          } 
        />

        {/* Teacher-only Routes */}
        <Route 
          path="/schedule" 
          element={
            <TeacherRoute>
              <PageTransition>
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Schedule Page (Teacher Only)</h1>
                  <p className="mt-4 text-gray-600">This page is under construction.</p>
                </div>
              </PageTransition>
            </TeacherRoute>
          } 
        />

        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            <PageTransition>
              <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a 
                  href="/" 
                  className="btn-primary"
                >
                  Go Home
                </a>
              </div>
            </PageTransition>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
