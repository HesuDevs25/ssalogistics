"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// export const metadata = {
//   title: "Contact Us | SSA Logistics Limited",
//   description: "Get in touch with SSA Logistics for vehicle handling, storage, and delivery services in Tanzania",
// };

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // In a real implementation, you would send the form data to an API
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Solid Background */}
      <section className="relative bg-[var(--primary)] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-24">
          <div className={`max-w-3xl transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Contact Us</h1>
            <p className="text-xl md:text-2xl text-white opacity-90">
              Get in touch with our team for inquiries, support, or feedback
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16 md:py-24 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold mb-6 text-[var(--primary)]">Get In Touch</h2>
              <p className="text-lg text-gray-700">
                Our team is ready to assist you with any inquiries about our services.
                Feel free to reach out through any of the following channels:
              </p>

              <div className="space-y-6">
                {/* Office Address */}
                <div className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-[var(--primary)] p-3 rounded-full mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-[var(--primary)]">Office Address</h3>
                      <p className="text-gray-700">
                        Tanzania Port Authority Complex<br />
                        Bandari Road<br />
                        Dar es Salaam, Tanzania
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-[var(--primary)] p-3 rounded-full mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-[var(--primary)]">Phone</h3>
                      <p className="text-gray-700">
                        <a href="tel:+255123456789" className="hover:text-[var(--primary)] transition-colors duration-300">+255 123 456 789</a><br />
                        <a href="tel:+255987654321" className="hover:text-[var(--primary)] transition-colors duration-300">+255 987 654 321</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-[var(--primary)] p-3 rounded-full mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-[var(--primary)]">Email</h3>
                      <p className="text-gray-700">
                        <a href="mailto:info@ssalogistics.co.tz" className="hover:text-[var(--primary)] transition-colors duration-300">info@ssalogistics.co.tz</a><br />
                        <a href="mailto:support@ssalogistics.co.tz" className="hover:text-[var(--primary)] transition-colors duration-300">support@ssalogistics.co.tz</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white shadow-lg p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-[var(--primary)]">Send Us a Message</h2>

              {isSubmitted ? (
                <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
                  <h3 className="font-bold">Message Sent!</h3>
                  <p>Thank you for contacting us. We&apos;ll get back to you shortly.</p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 text-[var(--primary)] hover:underline focus:outline-none"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label 
                        htmlFor="name" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-300"
                      />
                    </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label 
                      htmlFor="phone" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label 
                      htmlFor="subject" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-300"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[var(--primary)] text-white px-8 py-3 rounded-md transition w-full hover:bg-[var(--primary-light)]"
                  >
                    <span className="flex items-center justify-center">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Solid Background */}
      <section className="py-16 md:py-24 bg-[var(--primary)] text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to simplify your logistics?</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white opacity-90">
            Join our clients who trust us with their vehicle handling and logistics needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/services" 
              className="bg-white text-[var(--primary)] px-8 py-3 rounded-md transition font-medium"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
                Explore Services
              </span>
            </Link>
            <Link 
              href="/portal" 
              className="bg-transparent border border-white text-white px-8 py-3 rounded-md hover:bg-white/10 transition font-medium"
            >
              Document Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 