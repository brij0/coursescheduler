import React, { useState } from 'react';

const AuthTest = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    message: '',
    error: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          message: 'Login successful!',
          error: ''
        });
      } else {
        setAuthState({
          ...authState,
          error: data.error || 'Login failed'
        });
      }
    } catch (err) {
      setAuthState({
        ...authState,
        error: 'Network error: ' + err.message
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAuthState({
          ...authState,
          message: data.message,
          error: ''
        });
      } else {
        setAuthState({
          ...authState,
          error: data.error || 'Registration failed'
        });
      }
    } catch (err) {
      setAuthState({
        ...authState,
        error: 'Network error: ' + err.message
      });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          message: 'Logged out successfully',
          error: ''
        });
      }
    } catch (err) {
      setAuthState({
        ...authState,
        error: 'Logout error: ' + err.message
      });
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/user/', {
        credentials: 'include'
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log('Auth check response:', data);
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          message: 'Already authenticated',
          error: ''
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          message: '',
          error: data.error || 'Not authenticated'
        });
      }
    } catch (err) {
      setAuthState({
        ...authState,
        error: 'Auth check error: ' + err.message
      });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Auth Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={checkAuthStatus}>Check Auth Status</button>
      </div>

      {authState.isAuthenticated ? (
        <div>
          <p>Welcome, {authState.user?.username}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div>
              <label>Username/Email:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <button type="submit">Login</button>
          </form>

          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <div>
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Email (@uoguelph.ca):</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <button type="submit">Register</button>
          </form>
        </>
      )}

      {authState.message && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          {authState.message}
        </div>
      )}

      {authState.error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {authState.error}
        </div>
      )}
    </div>
  );
};

export default AuthTest;