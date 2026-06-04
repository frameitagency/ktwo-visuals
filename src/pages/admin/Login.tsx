import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router';
import { Camera, Loader2, ArrowLeft } from 'lucide-react';
import React from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Site
        </Link>
        <div className="flex justify-center text-gray-900 mb-6">
          <Camera className="w-10 h-10" strokeWidth={1} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-light text-gray-900 tracking-tight">
          Studio Access
        </h2>
        <p className="mt-2 text-center text-sm font-mono tracking-widest text-gray-400 uppercase">
          Authorized Personnel Only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2 font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white px-6 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 shadow-lg flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
