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
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex items-center bg-gradient-blue overflow-hidden">
        {/* Animated background elements */}
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

        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`}>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="gradient-text">Your Trusted Partner</span> in Vehicle Logistics
              </h1>
              <p className="text-xl md:text-2xl text-gray-200">
                SSA Logistics Limited is an authorized agent of Tanzania Port Authority, 
                specializing in vehicle handling, storage, and delivery.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/portal" 
                  className="relative overflow-hidden btn-glow text-white px-8 py-3 rounded-md transition group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md z-0"></span>
                  <span className="relative z-10 flex items-center">
                    <svg className="w-5 h-5 mr-2 transform transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Document Portal
                  </span>
                </Link>
                <Link 
                  href="/contact" 
                  className="glass text-white px-8 py-3 rounded-md hover:bg-white/20 transition font-medium text-lg"
                >
                  Contact Us
                </Link>
              </div>
            </div>
            <div className={`hidden md:block relative h-96 transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`}>
              <div className="absolute inset-0 glass rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                <Image
                  src="/cars.png"
                  alt="Cars"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview with Glass Cards */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive logistics solutions with a focus on vehicle handling and storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ICDV Service */}
            <div className="glass hover-lift p-8 rounded-lg transition-all duration-300">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7a4 4 0 1 0 0 8 4 4 0 1 0 0-8z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 gradient-text">ICDV - Vehicle Storage</h3>
              <p className="text-gray-600 mb-4">
                Specialized storage facility for imported vehicles with security and proper handling.
              </p>
              <Link href="/services#icdv" className="inline-flex items-center text-blue-600 font-medium group">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>

            {/* ICD Service */}
            <div className="glass hover-lift p-8 rounded-lg transition-all duration-300">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 gradient-text">ICD - Container Storage</h3>
              <p className="text-gray-600 mb-4">
                Secure container storage facility for imports with efficient handling and processing.
              </p>
              <Link href="/services#icd" className="inline-flex items-center text-blue-600 font-medium group">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>

            {/* CFS Service */}
            <div className="glass hover-lift p-8 rounded-lg transition-all duration-300">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 gradient-text">CFS - Export Handling</h3>
              <p className="text-gray-600 mb-4">
                Container freight station specialized in export handling and processing.
              </p>
              <Link href="/services#cfs" className="inline-flex items-center text-blue-600 font-medium group">
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
              className="relative overflow-hidden btn-glow text-white px-8 py-3 rounded-md transition group inline-flex items-center"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md z-0"></span>
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2 transform transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
                View All Services
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Numbers */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Why Choose SSA Logistics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
              <div key={index} className="glass hover-lift p-6 rounded-lg text-center transition-all duration-300">
                <p className="text-5xl font-bold gradient-text mb-2">{stat.number}</p>
                <p className="text-lg text-gray-700">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Animated Background */}
      <section className="py-16 md:py-24 bg-gradient-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">Ready to simplify your logistics?</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
            Let us handle your vehicle logistics while you focus on your business.
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
                Get in Touch
              </span>
            </Link>
            <Link 
              href="/services" 
              className="glass text-white px-8 py-3 rounded-md hover:bg-white/20 transition font-medium text-lg"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Document Verification Intro with Modern Design */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:block relative h-96">
              <div className="absolute inset-0 glass rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p className="mt-4 text-gray-300">Document Verification Image</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold gradient-text">Document Verification Portal</h2>
              <p className="text-xl text-gray-600">
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
                    <svg className="w-6 h-6 text-green-500 mr-2 transform transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700 group-hover:text-blue-600 transition-colors duration-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link 
                  href="/portal" 
                  className="relative overflow-hidden btn-glow text-white px-8 py-3 rounded-md transition group inline-flex items-center"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md z-0"></span>
                  <span className="relative z-10 flex items-center">
                    <svg className="w-5 h-5 mr-2 transform transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
