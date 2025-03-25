"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// export const metadata = {
//   title: "FAQ | SSA Logistics Limited",
//   description: "Frequently asked questions about vehicle importation, logistics, and document verification at SSA Logistics",
// };

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "What services does SSA Logistics provide?",
      answer: `SSA Logistics Limited provides a range of services including:
        • Vehicle handling, storage, and delivery (ICDV)
        • Container storage for imports (ICD)
        • Container handling for exports (CFS)
        • Transportation services throughout Tanzania
        • Customs clearance and documentation
        
        As an authorized agent of the Tanzania Port Authority, we specialize in vehicle logistics, making the import process seamless and efficient.`
    },
    {
      question: "How do I track my vehicle through your system?",
      answer: "You can track your vehicle through our Document Verification Portal. Once you have an account, you'll be able to see real-time updates on your vehicle's status, from port arrival to final delivery. The portal provides detailed information on each stage of the process, including customs clearance status, storage location, and expected delivery dates."
    },
    {
      question: "What documents are required to import a vehicle to Tanzania?",
      answer: `The following documents are typically required for vehicle importation:
        • Original Bill of Lading
        • Commercial Invoice
        • Pre-Export Verification of Conformity (PVoC) Certificate
        • Import Declaration Form (IDF)
        • Vehicle Registration Card from country of origin
        • Passport or Identification of the importer
        
        Additional documents may be required based on the specific circumstances of the importation. Our team can provide guidance on your specific requirements.`
    },
    {
      question: "How long does the vehicle clearance process take?",
      answer: "The vehicle clearance process typically takes 3-7 working days from the time all required documents are submitted and duties are paid. However, processing times can vary based on customs procedures, vehicle inspection requirements, and document verification. Through our efficient processes and strong relationships with authorities, we strive to make the clearance as quick as possible."
    },
    {
      question: "What are the import duties and taxes for vehicles in Tanzania?",
      answer: "Import duties and taxes for vehicles in Tanzania include import duty (25%), excise duty (varying from 5% to 25% depending on engine capacity and age), Value Added Tax (18%), and various other levies. The total cost typically ranges from 40% to 60% of the CIF (Cost, Insurance, and Freight) value of the vehicle. For a precise calculation, we recommend contacting our customer service team who can provide an estimate based on your specific vehicle details."
    },
    {
      question: "Do you offer transportation services for vehicles to other cities in Tanzania?",
      answer: "Yes, we offer comprehensive transportation services for vehicles to all major cities and regions in Tanzania. Our fleet includes specialized car carriers designed for safe vehicle transport. We provide door-to-door delivery services with real-time tracking, insurance coverage, and professional handling to ensure your vehicle arrives at its destination in the same condition it was received."
    },
    {
      question: "How secure is your vehicle storage facility?",
      answer: "Our vehicle storage facility (ICDV) is highly secure with 24/7 security personnel, CCTV surveillance, perimeter fencing, and controlled access. Vehicles are stored in designated areas protected from environmental factors. We also implement strict handling protocols to ensure vehicles are moved and managed by trained professionals only. Regular security audits and inspections are conducted to maintain the highest standards of security."
    },
    {
      question: "Can I inspect my vehicle before clearance?",
      answer: "Yes, you can arrange to inspect your vehicle before clearance. You'll need to schedule an appointment through our customer service team, and proper identification will be required upon arrival at our facility. During the inspection, you'll be accompanied by a staff member. Please note that while you can inspect the vehicle, it cannot be removed from the facility until all customs procedures are completed and duties are paid."
    },
    {
      question: "What happens if my vehicle is damaged during storage or transport?",
      answer: "In the unlikely event that your vehicle is damaged while in our care, our insurance policy covers such incidents. We conduct thorough inspections when vehicles enter and leave our facility, documenting their condition with photos. If damage occurs, you should immediately report it to our customer service team. We'll initiate an investigation and process a claim through our insurance. We pride ourselves on our careful handling procedures, making such incidents extremely rare."
    },
    {
      question: "How do I set up an account on your Document Verification Portal?",
      answer: "Setting up an account on our Document Verification Portal is simple. Visit the Portal section on our website and click on 'Register'. You'll need to provide your basic information, email address, and create a password. For business accounts, you'll also need to provide your company registration details. Once submitted, our team will verify your information and activate your account, typically within 24 hours. You'll receive a confirmation email with login instructions."
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Animated Background */}
      <section className="relative bg-gradient-blue overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-blue-900/40"></div>
        
        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 5}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className={`max-w-3xl transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">Frequently Asked Questions</h1>
            <p className="text-xl md:text-2xl text-gray-200">
              Find answers to common questions about our logistics services
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion with Glass Effect */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="mb-12 glass p-8 rounded-lg">
            <p className="text-lg text-gray-700">
              Browse through our frequently asked questions to find answers about our vehicle handling,
              storage, delivery, and document verification services. If you can&apos;t find the information
              you&apos;re looking for, please don&apos;t hesitate to contact us.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-white shadow-lg hover:shadow-xl p-6 rounded-lg transition-all duration-300 hover:-translate-y-1"
              >
                <button
                  className="flex justify-between items-center w-full text-left focus:outline-none group"
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="text-lg font-semibold text-blue-900 group-hover:text-blue-600 transition-colors duration-300">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-blue-600 transform transition-transform duration-300 ${
                      activeIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeIndex === index ? 'max-h-[1000px] mt-4' : 'max-h-0'
                  }`}
                >
                  <p className="text-gray-700 whitespace-pre-line">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section with Modern Design */}
      <section className="py-16 md:py-24 bg-gradient-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">Still have questions?</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
            Our team is ready to assist you with any inquiries about our services.
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
            <a 
              href="tel:+255123456789" 
              className="glass text-white px-8 py-3 rounded-md hover:bg-white/20 transition font-medium text-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 