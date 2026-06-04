import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (params: { companyName: string; industry: string; domain: string; name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('amdox_nexus_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync token value & retrieve profile matching credentials
  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
        } else {
          // Token is stale or invalid, flush
          logout();
        }
      } catch (err) {
        console.error('Failed restoring secure user session: ', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('amdox_nexus_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return true;
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Invalid credentials');
      }
    } catch (err: any) {
      alert(err.message || 'Login attempt failed.');
      return false;
    }
  }

  async function signup(params: { 
    companyName: string; 
    industry: string; 
    domain: string; 
    name: string; 
    email: string; 
    password: string 
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('amdox_nexus_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return true;
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed activation setup');
      }
    } catch (err: any) {
      alert(err.message || 'Signup failed.');
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('amdox_nexus_token');
    setToken(null);
    setUser(null);
  }

  // Wrapper around typical fetch to inject bearer tokens mapping user security
  async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const response = await fetch(endpoint, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(errorResponse.error || `Server responded with status ${response.status}`);
    }
    
    return response.json();
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be mapped inside an AuthProvider element');
  }
  return context;
}
