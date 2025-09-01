"use client"
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { loginSchema } from '@/validation/yupvalidation/loginSchema';
import { signupSchema } from '@/validation/yupvalidation/signupSchema';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    try {
      const endpoint = isLogin
        ? "http://localhost:3000/api/auth/login"
        : "http://localhost:3000/api/auth/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.token) {
        login(data.token);
        resetForm();
      }

      toast.success(isLogin ? "Login successful!" : "Signup successful!");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.message); (err.message);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };
  const toggleMode = () => {
    setIsLogin(!isLogin);
  };
  return (

    <div className="min-h-screen bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center p-2 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Sparkles className="w-4 h-4 text-white opacity-30" />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glass morphism container */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8 transform transition-all ">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-full mb-4 animate-bounce">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h1>
            <p className="text-gray-300 animate-fade-in-delay">
              {isLogin ? 'Sign in to your account' : 'Create your new account'}
            </p>
          </div>

          <Formik
            initialValues={
              isLogin
                ? { email: '', password: '' }
                : { name: '', email: '', password: '', }
            }
            validationSchema={isLogin ? loginSchema : signupSchema}
            onSubmit={handleSubmit}
            key={isLogin ? 'login' : 'signup'} // Reset form when switching modes
          >
            {({ isSubmitting, errors, touched, handleSubmit: formikHandleSubmit }) => (
              <div className="space-y-6">
                {/* Name field for signup */}
                {!isLogin && (
                  <div className="relative transform transition-all duration-300 animate-slide-in">
                    <Field
                      name="name"
                      type="text"
                      placeholder="Full Name"
                      className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${errors.name && touched.name ? 'border-red-500' : 'border-white/20'
                        }`}
                    />
                    <User className="absolute left-4 top-[29px] transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <ErrorMessage name="name" component="div" className="text-red-400 text-sm mt-2" />
                  </div>
                )}

                {/* Email field */}
                <div className="relative transform transition-all duration-300 animate-slide-in-delay">
                  <Field
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${errors.email && touched.email ? 'border-red-500' : 'border-white/20'
                      }`}
                  />
                  <Mail className="absolute left-4 top-[29px] transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <ErrorMessage name="email" component="div" className="text-red-400 text-sm mt-2" />
                </div>

                {/* Password field */}
                <div className="relative transform transition-all duration-300 animate-slide-in-delay-2">
                  <Field
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className={`w-full pl-12 pr-12 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${errors.password && touched.password ? 'border-red-500' : 'border-white/20'
                      }`}
                  />
                  <Lock className="absolute left-4 items-center flex justify-center top-[29px] transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[29px] transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <ErrorMessage name="password" component="div" className="text-red-400 text-sm mt-2" />
                </div>


                {/* Submit Button */}
                <button
                  type="button"
                  onClick={formikHandleSubmit}
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Social Login Divider */}
          

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex items-center justify-center px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>
            )}
          </Formik>

          {/* Toggle between Login/Signup */}
          <div className="text-center mt-8">
            <p className="text-gray-300">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={toggleMode}
                className="ml-2 text-purple-300 hover:text-purple-200 font-semibold transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-float {
          animation: float infinite ease-in-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
        
        .animate-slide-in {
          animation: slide-in 0.6s ease-out;
        }
        
        .animate-slide-in-delay {
          animation: slide-in 0.6s ease-out 0.1s both;
        }
        
        .animate-slide-in-delay-2 {
          animation: slide-in 0.6s ease-out 0.2s both;
        }
        
        .animate-slide-in-delay-3 {
          animation: slide-in 0.6s ease-out 0.3s both;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}