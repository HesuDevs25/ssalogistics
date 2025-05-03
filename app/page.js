"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

// Predefined floating elements positions and animations
const floatingElements = [
  { top: "10%", left: "20%", duration: "6s", delay: "0s" },
  { top: "30%", left: "70%", duration: "8s", delay: "1s" },
  { top: "50%", left: "40%", duration: "7s", delay: "2s" },
  { top: "70%", left: "80%", duration: "9s", delay: "3s" },
  { top: "90%", left: "30%", duration: "7s", delay: "4s" }
];

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/bg.webp" 
            alt="Background" 
            fill 
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-transparent opacity-80"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32 z-10">
          <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
            <div className={`space-y-8 transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                <span className="text-white">Your Trusted Partner</span> in Vehicle Logistics
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                SSA Logistics Limited is an authorized agent of Tanzania Port Authority, 
                specializing in vehicle handling, storage, and delivery.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Link 
                  href="/portal" 
                  className="bg-white text-[var(--primary)] px-8 py-3 rounded-md hover:bg-gray-100 transition font-medium shadow-md"
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    Get Quote
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview with Cards */}
      <section className="py-16 md:py-24 bg-[#F0F5FA] relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--primary)]">Our Services</h2>
            <p className="text-xl text-[var(--text-dark)] max-w-3xl mx-auto">
              We provide comprehensive logistics solutions with a focus on vehicle handling and storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ICDV Service */}
            <div className="bg-white p-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg border-t-4 border-[var(--primary)]">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-[#E6F0FA] text-[var(--primary)] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7a4 4 0 1 0 0 8 4 4 0 1 0 0-8z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--primary)]">ICDV - Vehicle Storage</h3>
              <p className="text-[var(--text-dark)] mb-4">
                Specialized storage facility for imported vehicles with security and proper handling.
              </p>
              <Link href="/services#icdv" className="inline-flex items-center text-[var(--primary)] font-medium group">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>

            {/* ICD Service */}
            <div className="bg-white p-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg border-t-4 border-[var(--accent)]">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-[#E6F0FA] text-[var(--primary)] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--primary)]">ICD - Container Storage</h3>
              <p className="text-[var(--text-dark)] mb-4">
                Secure container storage facility for imports with efficient handling and processing.
              </p>
              <Link href="/services#icd" className="inline-flex items-center text-[var(--primary)] font-medium group">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>

            {/* CFS Service */}
            <div className="bg-white p-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg border-t-4 border-[var(--secondary)]">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-[#E6F0FA] text-[var(--primary)] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--primary)]">CFS - Export Handling</h3>
              <p className="text-[var(--text-dark)] mb-4">
                Container freight station specialized in export handling and processing.
              </p>
              <Link href="/services#cfs" className="inline-flex items-center text-[var(--primary)] font-medium group">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/services" 
              className="bg-[var(--primary)] text-white px-8 py-3 rounded-md hover:bg-[var(--primary-light)] transition font-medium inline-flex items-center"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
                View All Services
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--primary)]">Why Choose SSA Logistics</h2>
            <p className="text-xl text-[var(--text-dark)] max-w-3xl mx-auto">
              We deliver exceptional service with a focus on reliability, security, and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: "10+", label: "Years of Experience" },
              { number: "5,000+", label: "Vehicles Handled Yearly" },
              { number: "98%", label: "Customer Satisfaction" },
              { number: "24/7", label: "Service Availability" }
            ].map((stat, index) => (
              <div key={index} className="bg-[var(--background-light)] p-6 rounded-lg text-center transition-all duration-300 shadow-sm">
                <p className="text-5xl font-bold text-[var(--primary)] mb-2">{stat.number}</p>
                <p className="text-lg text-[var(--text-dark)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[var(--primary)] text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to simplify your logistics?</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white opacity-90">
            Let us handle your vehicle logistics while you focus on your business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/contact" 
              className="bg-white text-[var(--primary)] px-8 py-3 rounded-md  transition font-medium"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Get in Touch
              </span>
            </Link>
            <Link 
              href="/services" 
              className="bg-transparent border border-white text-white px-8 py-3 rounded-md hover:bg-white/10 transition font-medium"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Document Verification Intro */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:block relative h-96">
              <div className="relative h-full w-full rounded-lg overflow-hidden border border-[var(--background-light)] shadow-md">
                <div className="absolute inset-0 bg-[var(--background-light)]/50 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p className="mt-4 text-[var(--text-dark)]">Document Verification Image</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)]">Document Verification Portal</h2>
              <p className="text-xl text-[var(--text-dark)]">
                Our secure online portal allows you to submit and track your documents in real-time,
                making the logistics process transparent and efficient.
              </p>
              <ul className="space-y-3">
                {[
                  "Secure document submission",
                  "Real-time status tracking",
                  "Email notifications on status changes",
                  "Secure storage of all documents"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start group">
                    <svg className="w-6 h-6 text-[var(--accent)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[var(--text-dark)]">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link 
                  href="/portal" 
                  className="bg-[var(--primary)] text-white px-8 py-3 rounded-md hover:bg-[var(--primary-light)] transition font-medium inline-flex items-center"
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Access Portal
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
