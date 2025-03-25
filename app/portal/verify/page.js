"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


export default function VerifyPage() {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Check your email
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-blue-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-gray-600">
                Please check your email and click the verification link to complete your registration.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the email?{" "}
                <button
                  onClick={async () => {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: email
                    });
                    if (error) {
                      alert('Error resending verification email. Please try again.');
                    } else {
                      alert('Verification email resent!');
                    }
                  }}
                  className="font-medium text-blue-900 hover:text-blue-800"
                >
                  Resend verification email
                </button>
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/portal"
                className="font-medium text-blue-900 hover:text-blue-800"
              >
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 