import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const HomeService = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    setIsVisible(true);

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => observer.observe(el));

    return () => {
      animateElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const services = [
    {
      id: 'residential',
      title: 'Residential Waste Collection',
      description: 'Regular waste pickup service for your home with flexible scheduling and eco-friendly disposal.',
      icon: '🏠',
      features: ['Weekly/Bi-weekly pickup', 'Recycling separation', 'Smart bin monitoring', 'Eco-friendly disposal'],
      price: 'Starting from $25/month',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'commercial',
      title: 'Commercial Waste Management',
      description: 'Comprehensive waste solutions for businesses, offices, and commercial establishments.',
      icon: '🏢',
      features: ['Bulk waste handling', '24/7 service', 'Compliance reporting', 'Cost optimization'],
      price: 'Custom pricing available',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'recycling',
      title: 'Specialized Recycling',
      description: 'Advanced recycling services for electronics, hazardous materials, and special waste types.',
      icon: '♻️',
      features: ['E-waste recycling', 'Hazardous material disposal', 'Certificate of destruction', 'Environmental compliance'],
      price: 'Quote on request',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'industrial',
      title: 'Industrial Waste Solutions',
      description: 'Heavy-duty waste management for manufacturing, construction, and industrial facilities.',
      icon: '🏭',
      features: ['Heavy machinery support', 'Scheduled maintenance', 'Waste stream analysis', 'Regulatory compliance'],
      price: 'Enterprise pricing',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const additionalServices = [
    {
      title: 'Emergency Cleanup',
      description: 'Rapid response service for urgent waste removal needs',
      icon: '🚨',
      available: '24/7'
    },
    {
      title: 'Bin Rental',
      description: 'Temporary and permanent bin solutions for any project size',
      icon: '🗂️',
      available: 'Same day'
    },
    {
      title: 'Waste Audit',
      description: 'Professional assessment to optimize your waste management',
      icon: '📊',
      available: 'Scheduled'
    },
    {
      title: 'Consultation',
      description: 'Expert advice on sustainable waste management practices',
      icon: '💡',
      available: 'On demand'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Trash2Cash Services
                </h1>
                <p className="text-gray-600 text-sm">Your Waste Management Partner</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-emerald-600 font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/login" 
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Comprehensive
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Waste Management
              </span>
              Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto">
              From residential pickup to industrial solutions - we handle all your waste management needs with cutting-edge technology and environmental responsibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Explore Services
              </button>
              <Link 
                to="/contact" 
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-300 shadow-xl"
              >
                Get Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive range of waste management solutions designed to meet your specific needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {services.map((service, index) => (
              <div 
                key={service.id}
                className={`group relative bg-gradient-to-br ${service.color} rounded-3xl p-8 text-white hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-on-scroll cursor-pointer`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onClick={() => setSelectedService(service.id === selectedService ? null : service.id)}
              >
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{service.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                      <p className="text-lg opacity-90">{service.description}</p>
                    </div>
                  </div>

                  <div className={`overflow-hidden transition-all duration-500 ${selectedService === service.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-4 mb-6">
                      <h4 className="text-xl font-semibold">Features:</h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <p className="text-xl font-bold text-yellow-300">{service.price}</p>
                      </div>
                    </div>
                  </div>

                  <button className="mt-4 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30">
                    {selectedService === service.id ? 'Show Less' : 'Learn More'}
                  </button>
                </div>

                <div className="absolute inset-0 bg-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Additional <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized services to complement your waste management needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalServices.map((service, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 animate-on-scroll group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {service.available}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple steps to get started with our waste management services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Contact Us', description: 'Get in touch for a free consultation and quote', icon: '📞' },
              { step: '02', title: 'Assessment', description: 'We evaluate your waste management needs', icon: '📋' },
              { step: '03', title: 'Custom Plan', description: 'Receive a tailored service plan', icon: '📝' },
              { step: '04', title: 'Service Start', description: 'Begin your waste management service', icon: '🚀' }
            ].map((item, index) => (
              <div key={index} className="text-center animate-on-scroll group" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Waste Management?
              </span>
            </h2>
            <p className="text-xl mb-8 text-emerald-100 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust us with their waste management needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Get Free Quote
              </Link>
              <Link 
                to="/register" 
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-300 shadow-xl"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Trash2Cash</h3>
              </div>
              <p className="text-gray-400">
                Leading waste management solutions for a sustainable future.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Residential</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Commercial</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Industrial</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Recycling</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 +1 (555) 123-4567</li>
                <li>📧 info@trash2cash.com</li>
                <li>📍 123 Green Street, Eco City</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Trash2Cash. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease-out;
        }

        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default HomeService;