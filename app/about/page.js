"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// export const metadata = {
//   title: "About Us | SSA Logistics Limited",
//   description: "Learn about SSA Logistics Limited - our history, mission, vision, and values",
// };

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { label: "Years of Experience", value: "10+" },
    { label: "Vehicles Handled", value: "50,000+" },
    { label: "Satisfied Clients", value: "5,000+" },
    { label: "Cities Covered", value: "25+" },
  ];

  const values = [
    {
      title: "Excellence",
      description: "We strive for excellence in every aspect of our service delivery.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
    },
    {
      title: "Integrity",
      description: "We maintain the highest standards of integrity in all our operations.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      ),
    },
    {
      title: "Innovation",
      description: "We continuously innovate to provide better solutions for our clients.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      ),
    },
    {
      title: "Customer Focus",
      description: "Our clients' satisfaction is at the heart of everything we do.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      ),
    },
  ];

  const galleryImages = [
    {
      src: "/icdv1.jpg",
      alt: "ICVD Facility 1",
      title: "Vehicle Storage Area",
      description: "Our state-of-the-art vehicle storage facility"
    },
    {
      src: "/icdv2.jpg",
      alt: "ICVD Facility 2",
      title: "Vehicle Storage Area",
      description: "Our state-of-the-art vehicle storage facility"
    },
    {
      src: "/icdv3.jpg",
      alt: "ICVD Facility 3",
      title: "Vehicle Storage Area",
      description: "Our state-of-the-art vehicle storage facility"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with New Background */}
      <section className="relative bg-[var(--primary)] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-24">
          <div className={`max-w-3xl transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">About Us</h1>
            <p className="text-xl md:text-2xl text-white opacity-90">
              Your trusted partner in logistics and vehicle handling
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="glass p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-6 text-[var(--primary)]">Our Story</h2>
              <p className="text-lg text-gray-700 mb-6">
                Founded in 2013, SSA Logistics Limited has grown to become a leading logistics company in Tanzania.
                As an authorized agent of the Tanzania Port Authority, we specialize in vehicle handling,
                storage, and delivery services.
              </p>
              <p className="text-lg text-gray-700">
                Our commitment to excellence and customer satisfaction has made us the preferred choice
                for many businesses and individuals in Tanzania. We continue to invest in modern facilities
                and technology to provide the best possible service to our clients.
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/icd.jpg"
                alt="SSA Logistics Facility"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-[var(--primary)]">Our Facilities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our modern facilities designed for efficient vehicle handling and storage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {galleryImages.map((image, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative h-80">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
                      <p className="text-sm opacity-90">{image.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="relative h-[80vh] rounded-lg overflow-hidden">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="mt-4 text-center text-white">
              <h3 className="text-xl font-semibold mb-2">{selectedImage.title}</h3>
              <p className="text-sm opacity-90">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="glass hover-lift p-6 rounded-lg text-center transition-all duration-300">
                <div className="text-4xl font-bold text-[var(--primary)] mb-2">{stat.value}</div>
                <div className="text-gray-700">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold mb-12 text-center text-[var(--primary)]">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg text-center transition-all duration-300 hover:-translate-y-1">
                <div className="bg-blue-100 text-[var(--primary)] p-3 rounded-full inline-block mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--primary)]">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with New Background */}
      <section className="py-16 md:py-24 bg-[var(--primary)] text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Join Our Journey</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white opacity-90">
            Be part of our success story and experience excellence in logistics.
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
    </div>
  );
} 