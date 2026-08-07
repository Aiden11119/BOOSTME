import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, User } from 'lucide-react';
import api from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      login(user, token, rememberMe);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/20 relative z-10 w-full">
        <div>
          <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-blue-600 to-purple-600 p-0.5 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 overflow-hidden">
            <img src="/logo-192.png" alt="BoostMe Logo" className="h-full w-full object-cover rounded-2xl -rotate-3 bg-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Sign in to BoostMe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center group">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer group-hover:text-blue-600 transition-colors">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <LogIn className="h-5 w-5 text-blue-200 group-hover:text-blue-100 transition-colors" aria-hidden="true" />
                )}
              </span>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>

      {/* Cartoon Mascot 1: Sleepy Coffee Cat (Bottom-Right) */}
      <div className="absolute bottom-0 right-2 lg:bottom-6 lg:right-16 z-20 flex items-end gap-3">
        <div className="hidden lg:block bg-white/80 backdrop-blur-md text-gray-800 text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-white/40 max-w-[220px] mb-8 relative after:content-[''] after:absolute after:bottom-0 after:right-6 after:w-0 after:h-0 after:border-t-[8px] after:border-t-white/80 after:border-x-[6px] after:border-x-transparent after:translate-y-full">
          💡 Let's get this bread! (Or at least a passing grade) 🐾
        </div>
        <img 
          src="/study-mascot.png" 
          alt="Coffee Cat" 
          className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain rotate-[-5deg] transform hover:scale-105 transition-transform duration-300" 
        />
      </div>

      {/* Cartoon Mascot 2: Nerdy Exam Owl (Bottom-Left) */}
      <div className="absolute bottom-0 left-2 lg:bottom-6 lg:left-16 z-20 flex items-end gap-3">
        <img 
          src="/study-owl.png" 
          alt="Nerdy Owl" 
          className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain rotate-[5deg] transform hover:scale-105 transition-transform duration-300" 
        />
        <div className="hidden lg:block bg-white/80 backdrop-blur-md text-gray-800 text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-white/40 max-w-[220px] mb-8 relative after:content-[''] after:absolute after:bottom-0 after:left-6 after:w-0 after:h-0 after:border-t-[8px] after:border-t-white/80 after:border-x-[6px] after:border-x-transparent after:translate-y-full">
          💡 Wait, did I submit the assignment on time?! 🦉
        </div>
      </div>

      {/* Cartoon Mascot 3: Crying Hamster (Top-Right) */}
      <div className="absolute top-2 right-2 lg:top-16 lg:right-16 z-20 flex flex-col items-center gap-3">
        <img 
          src="/study-hamster.png" 
          alt="Stressed Hamster" 
          className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain transform hover:scale-105 transition-transform duration-300" 
        />
        <div className="hidden lg:block bg-white/80 backdrop-blur-md text-gray-800 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-white/40 max-w-[200px] text-center relative after:content-[''] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0 after:border-b-[8px] after:border-b-white/80 after:border-x-[6px] after:border-x-transparent after:-translate-y-full">
          😭 Is 1 + 1 = 11? Just let me pass... 🐹
        </div>
      </div>

      {/* Cartoon Mascot 4: Sleeping Koala (Top-Left) */}
      <div className="absolute top-2 left-2 lg:top-16 lg:left-16 z-20 flex flex-col items-center gap-3">
        <img 
          src="/study-koala.png" 
          alt="Sleeping Koala" 
          className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain transform hover:scale-105 transition-transform duration-300" 
        />
        <div className="hidden lg:block bg-white/80 backdrop-blur-md text-gray-800 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-white/40 max-w-[200px] text-center relative after:content-[''] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0 after:border-b-[8px] after:border-b-white/80 after:border-x-[6px] after:border-x-transparent after:-translate-y-full">
          😴 Just 5 more minutes... Is it graduation yet? 🐨🎓
        </div>
      </div>
    </div>
  );
};

export default Login;
