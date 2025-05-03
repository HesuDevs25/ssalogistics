"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// export const metadata = {
//   title: "Services | SSA Logistics Limited",
//   description: "Explore our comprehensive vehicle logistics services including vehicle storage, container handling, and customs clearance",
// };

export default function ServicesPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const services = [
    {
      title: "Vehicle Handling (ICDV)",
      description: "Comprehensive vehicle handling services including storage, maintenance, and delivery. Our ICDV facility ensures your vehicles are handled with utmost care and security.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      ),
      features: [
        "Secure storage facilities",
        "Regular maintenance checks",
        "24/7 security surveillance",
        "Insurance coverage",
        "Real-time tracking"
      ]
    },
    {
      title: "Container Storage (ICD)",
      description: "State-of-the-art container storage facilities for imports. Our ICD services provide efficient handling and storage solutions for your cargo.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
      ),
      features: [
        "Temperature-controlled storage",
        "Customs clearance assistance",
        "Inventory management",
        "Security systems",
        "Loading/unloading services"
      ]
    },
    {
      title: "Container Freight Station (CFS)",
      description: "Efficient container handling for exports. Our CFS services ensure your cargo is properly packed and ready for shipment.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
        </svg>
      ),
      features: [
        "Container stuffing",
        "Cargo consolidation",
        "Documentation services",
        "Quality control",
        "Export clearance"
      ]
    },
    {
      title: "Transportation Services",
      description: "Reliable transportation services throughout Tanzania. Our fleet ensures safe and timely delivery of your cargo.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      features: [
        "Nationwide coverage",
        "GPS tracking",
        "Scheduled deliveries",
        "Express services",
        "Insurance coverage"
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Solid Background */}
      <section className="relative bg-[var(--primary)] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-24">
          <div className={`max-w-3xl transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Our Services</h1>
            <p className="text-xl md:text-2xl text-white opacity-90">
              Comprehensive logistics solutions for your vehicle and cargo needs
            </p>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="mb-12 glass p-8 rounded-lg">
            <p className="text-lg text-gray-700">
              As an authorized agent of the Tanzania Port Authority, we provide a wide range of logistics services
              to meet your vehicle and cargo handling needs. Our modern facilities and experienced team ensure
              efficient and secure handling of your valuable assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className="glass hover-lift p-8 rounded-lg transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 text-[var(--primary)] p-3 rounded-full mr-4">
                    {service.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--primary)]">{service.title}</h2>
                </div>
                <p className="text-gray-700 mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-[var(--primary)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold mb-12 text-center text-[var(--primary)]">Our Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Initial Contact",
                description: "Get in touch with our team to discuss your requirements"
              },
              {
                step: "02",
                title: "Documentation",
                description: "Submit necessary documents and complete required paperwork"
              },
              {
                step: "03",
                title: "Processing",
                description: "Our team handles your request with utmost care"
              },
              {
                step: "04",
                title: "Collection",
                description: "Cpllect you vehicle at your convinience"
              }
            ].map((item, index) => (
              <div key={index} className="glass hover-lift p-6 rounded-lg text-center transition-all duration-300">
                <div className="text-4xl font-bold text-[var(--primary)] mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--primary)]">{item.title}</h3>
                <p className="text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Solid Background */}
      <section className="py-16 md:py-24 bg-[var(--primary)] text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to get started?</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white opacity-90">
            Contact us today to learn more about our services and how we can help you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/contact" 
              className="bg-white text-[var(--primary)] px-8 py-3 rounded-md transition font-medium"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Contact Us
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