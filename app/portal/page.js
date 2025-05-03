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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      <section className="relative bg-[var(--background-dark)] overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--primary)]/20 to-[var(--primary)]/40"></div>
        
        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingElements.map((element, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl"
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
            <p className="text-xl text-gray-200 mb-8">
              Access our secure document verification system for vehicle logistics.
            </p>
          </div>

          {/* Auth Card */}
          <div className="max-w-md mx-auto">
            <div className="glass p-8 rounded-lg shadow-lg border border-white/20">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {isLogin ? "Sign In" : "Register"}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      isLogin
                        ? "bg-[var(--primary)] text-white"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      !isLogin
                        ? "bg-[var(--primary)] text-white"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-white">
                  {typeof error === 'string' ? error : error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-200 mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required={!isLogin}
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-200 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        required={!isLogin}
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-200 mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        required={!isLogin}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary-light)] border-gray-300 rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-200"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <Link
                        href="/portal/reset-password"
                        className="font-medium text-[var(--accent-light)] hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative overflow-hidden btn-glow text-white py-2 px-4 rounded-md transition-colors disabled:opacity-70"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-md z-0"></span>
                    <span className="relative z-10">
                      {isLoading
                        ? "Processing..."
                        : isLogin
                        ? "Sign In"
                        : "Create Account"}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-gray-200">
                {isLogin ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={toggleForm}
                      className="font-medium text-[var(--accent-light)] hover:text-white transition-colors"
                    >
                      Register now
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={toggleForm}
                      className="font-medium text-[var(--accent-light)] hover:text-white transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                )}
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