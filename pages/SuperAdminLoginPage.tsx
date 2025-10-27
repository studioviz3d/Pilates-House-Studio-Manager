import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';

const SuperAdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password cannot be empty.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, redirect to the super admin dashboard
      navigate('/super-admin/dashboard');
    } catch (err: any) {
      setError('Authentication failed. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-sm p-8 space-y-8 bg-slate-800 shadow-lg rounded-2xl border border-slate-700">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold">Super Admin Portal</h2>
          <p className="mt-2 text-sm text-slate-400">Access restricted to authorized personnel</p>
        </div>
        
        {error && (
            <div className="flex items-center p-3 text-sm text-red-300 bg-red-900/50 border border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="relative">
            <Mail className="absolute w-5 h-5 text-slate-500 top-3.5 left-4"/>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-12 pr-4 py-3 text-slate-200 bg-slate-700 border-2 border-slate-600 rounded-lg focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute w-5 h-5 text-slate-500 top-3.5 left-4"/>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full pl-12 pr-4 py-3 text-slate-200 bg-slate-700 border-2 border-slate-600 rounded-lg focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;