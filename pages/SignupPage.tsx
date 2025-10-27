import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Dumbbell, Mail, Lock, User, AlertCircle } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
        setError('All fields are required.');
        return;
    }
    if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      // The onAuthStateChanged listener in AuthProvider will handle fetching claims and navigation
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please log in.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-200">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Dumbbell className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your Account</h2>
          <p className="mt-2 text-sm text-gray-600">Start managing your studio today</p>
        </div>
        
        {error && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="relative">
            <User className="absolute w-5 h-5 text-gray-400 top-3.5 left-4"/>
            <input
              name="name"
              type="text"
              required
              className="w-full pl-12 pr-4 py-3 text-gray-700 bg-gray-100 border-2 border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="relative">
            <Mail className="absolute w-5 h-5 text-gray-400 top-3.5 left-4"/>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-12 pr-4 py-3 text-gray-700 bg-gray-100 border-2 border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute w-5 h-5 text-gray-400 top-3.5 left-4"/>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full pl-12 pr-4 py-3 text-gray-700 bg-gray-100 border-2 border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
            </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;