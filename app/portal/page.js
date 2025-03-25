"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

// export const metadata = {
//   title: "Document Verification Portal | SSA Logistics Limited",
//   description: "Access our secure document verification portal for tracking and submitting your vehicle import documents",
// };

// Predefined floating elements positions and animations
const floatingElements = [
  { top: "10%", left: "20%", duration: "6s", delay: "0s" },
  { top: "30%", left: "70%", duration: "8s", delay: "1s" },
  { top: "50%", left: "40%", duration: "7s", delay: "2s" },
  { top: "70%", left: "80%", duration: "9s", delay: "3s" },
  { top: "90%", left: "30%", duration: "7s", delay: "4s" }
];

export default function PortalPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });

      if (error) {
        console.error('Resend verification error:', error);
        setError("Failed to resend verification email. Please try again.");
        return;
      }

      setError("Verification email has been resent. Please check your inbox.");
      setShowResendButton(false);
    } catch (error) {
      console.error('Resend verification error:', error);
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setResendEmail(email);
          setShowResendButton(true);
          setError(
            <div className="flex flex-col space-y-2">
              <p>Please check your email for the verification link.</p>
              <p className="text-sm">
                Haven&apos;t received the email?{' '}
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 underline focus:outline-none disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Click here to resend"}
                </button>
              </p>
            </div>
          );
          return;
        }
        setError(error.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      // Only proceed to check profile if auth was successful
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError("Failed to fetch user profile. Please try again.");
        return;
      }

      setError("");
      setShowResendButton(false);
      
      // Redirect based on user role
      switch (profile?.role) {
        case 'admin':
          router.push("/portal/admin");
          break;
        case 'staff':
          router.push("/portal/staff");
          break;
        case 'customer':
        default:
          router.push("/portal/dashboard");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error('Login process error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (formData) => {
    setIsLoading(true);
    try {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match. Please check and try again.");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone_number: formData.phoneNumber,
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        setError(authError.message || "Failed to create account. Please try again.");
        return;
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: formData.name,
            phone_number: formData.phoneNumber,
            role: 'customer',
            email: formData.email,
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await supabase.auth.signOut();
        setError(profileError.message || "Failed to create user profile. Please try again.");
        return;
      }

      setError("");
      router.push("/portal/verify");
    } catch (error) {
      console.error('Registration process error:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      await handleLogin(formData.email, formData.password);
    } else {
      await handleRegistration(formData);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({
      email: "",
      password: "",
      name: "",
      phoneNumber: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-blue overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-blue-900/40"></div>
        
        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingElements.map((element, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
              style={{
                top: element.top,
                left: element.left,
                animation: `float ${element.duration} infinite ease-in-out`,
                animationDelay: element.delay,
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">Document Verification Portal</h1>
            <p className="text-xl md:text-2xl text-gray-200">
              Securely manage and track your vehicle importation documents
            </p>
          </div>
        </div>
      </section>

      {/* Portal Login/Register Section */}
      <section className="py-16 md:py-24 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-lg mx-auto">
            <div className="bg-white shadow-lg p-8 rounded-lg">
              <div className="flex mb-6 border-b">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`pb-3 px-4 font-medium ${
                    isLogin
                      ? "text-blue-900 border-b-2 border-blue-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`pb-3 px-4 font-medium ${
                    !isLogin
                      ? "text-blue-900 border-b-2 border-blue-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Register
                </button>
              </div>

              <h2 className="text-2xl font-bold mb-6 text-blue-900">
                {isLogin ? "Sign in to your account" : "Create a new account"}
              </h2>

              {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
                  {typeof error === 'string' ? error : error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required={!isLogin}
                        placeholder="e.g., +255 123 456 789"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                )}

                {isLogin && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <a href="#" className="text-blue-900 hover:underline">
                        Forgot your password?
                      </a>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative overflow-hidden btn-glow text-white px-8 py-3 rounded-md transition group w-full"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md z-0"></span>
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        <span>Processing...</span>
                      </div>
                    ) : isLogin ? (
                      "Sign In"
                    ) : (
                      "Create Account"
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={toggleForm}
                  className="text-blue-900 hover:underline focus:outline-none"
                >
                  {isLogin
                    ? "Need an account? Register here"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Features Section */}
      <section className="py-16 md:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold mb-12 text-center gradient-text">Portal Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-blue-900">Document Submission</h3>
              <p className="text-gray-700 text-center">
                Easily upload and manage all your vehicle import documents in one secure place.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-blue-900">Status Tracking</h3>
              <p className="text-gray-700 text-center">
                Monitor the real-time status of your vehicle and document processing at each stage.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-blue-900">Notifications</h3>
              <p className="text-gray-700 text-center">
                Receive instant notifications about document status changes and approvals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Need Help Section */}
      <section className="py-16 md:py-24 bg-gradient-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-bold mb-6 gradient-text">Need Assistance?</h2>
          <p className="text-lg text-gray-200 mb-8">
            Our support team is available to help you with any questions about the document portal.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/contact" 
              className="relative overflow-hidden btn-glow text-white px-8 py-3 rounded-md transition group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md z-0"></span>
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2 transform transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Contact Support
              </span>
            </Link>
            <a 
              href="tel:+255123456789" 
              className="glass text-white px-8 py-3 rounded-md hover:bg-white/20 transition font-medium text-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 