import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`text-center lg:text-left transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
                Turn Your 
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 cursor-default"> Trash </span>
                into 
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent hover:from-emerald-300 hover:to-teal-300 transition-all duration-300 cursor-default"> Cash</span>
              </h1>
              <p className={`text-xl lg:text-2xl mb-8 text-emerald-100 leading-relaxed transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Join Sri Lanka's first smart waste management platform. Earn money while protecting our beautiful island's environment.
              </p>
              
              <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Link
                  to="/register"
                  className="group bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden"
                >
                  <span className="relative z-10">Start Earning Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
                <Link
                  to="/login"
                  className="group border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-emerald-800 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
              </div>

              {/* Service Provider Login Links */}
              <div className={`flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8 transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <p className="text-emerald-100 font-medium mr-2">Service Providers:</p>
                <Link
                  to="/pickup-agent/login"
                  className="text-emerald-200 hover:text-white underline text-sm font-medium transition-colors duration-300"
                >
                  Agent Login
                </Link>
                <span className="text-emerald-200">|</span>
                <Link
                  to="/pickup-partner/login"
                  className="text-emerald-200 hover:text-white underline text-sm font-medium transition-colors duration-300"
                >
                  Partner Login
                </Link>
                <span className="text-emerald-200">|</span>
                <Link
                  to="/recycler/login"
                  className="text-emerald-200 hover:text-white underline text-sm font-medium transition-colors duration-300"
                >
                  Recycler Login
                </Link>
                <span className="text-emerald-200">|</span>
                <Link
                  to="/admin/login"
                  className="text-emerald-200 hover:text-white underline text-sm font-medium transition-colors duration-300"
                >
                  Admin Login
                </Link>
              </div>
            </div>
            <div className={`relative transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center group">
                    <div className="bg-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 hover:shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-emerald-200 transition-colors">Earn Money</h3>
                    <p className="text-sm text-emerald-100">Get paid for recycling</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-teal-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 hover:shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-teal-200 transition-colors">Smart Tracking</h3>
                    <p className="text-sm text-teal-100">GPS-enabled bins</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-cyan-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 hover:shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-cyan-200 transition-colors">Real-time</h3>
                    <p className="text-sm text-cyan-100">Live monitoring</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 hover:shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-emerald-200 transition-colors">Analytics</h3>
                    <p className="text-sm text-emerald-100">Track your impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Start Earning from Your Waste?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of Sri Lankans who are already earning money while protecting the environment. 
            Sign up today and start your journey towards sustainable living.
          </p>
          
          {/* Always visible buttons - no conditional rendering */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              to="/register"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Sign In
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              100% Free to Join
            </div>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Start Earning Immediately
            </div>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Help Save the Environment
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-emerald-600 transition-colors duration-300">
              How Trash2Cash Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our innovative platform makes waste management simple, profitable, and environmentally friendly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-2xl border border-emerald-200 hover:shadow-xl hover:scale-105 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer animate-on-scroll hover-glow">
              <div className="bg-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">Smart Bin Management</h3>
              <p className="text-gray-700 group-hover:text-gray-800 transition-colors">
                Monitor your waste bins in real-time with our IoT-enabled smart bins. Get notifications when they're full and schedule pickups efficiently.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border border-teal-200 hover:shadow-xl hover:scale-105 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer animate-on-scroll hover-glow">
              <div className="bg-teal-500 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-700 transition-colors">Earn Cash Rewards</h3>
              <p className="text-gray-700 group-hover:text-gray-800 transition-colors">
                Turn your recyclable waste into money. Earn points for every kilogram of waste you contribute and convert them to cash rewards.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-cyan-50 to-cyan-100 p-8 rounded-2xl border border-cyan-200 hover:shadow-xl hover:scale-105 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer animate-on-scroll hover-glow">
              <div className="bg-cyan-500 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-cyan-700 transition-colors">Analytics Dashboard</h3>
              <p className="text-gray-700 group-hover:text-gray-800 transition-colors">
                Track your environmental impact with detailed analytics. See how much you've recycled and your contribution to sustainability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-900 to-teal-800 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold mb-4 hover:text-emerald-300 transition-colors">Our Impact</h2>
            <p className="text-xl text-emerald-300">Making a difference in Sri Lanka's environment</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer animate-on-scroll hover-lift">
              <div className="text-4xl font-bold text-emerald-400 mb-2 group-hover:text-emerald-300 transition-colors animate-count-up">25,000+</div>
              <div className="text-emerald-300 group-hover:text-white transition-colors">Kilograms Recycled</div>
            </div>
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer animation-delay-300">
              <div className="text-4xl font-bold text-teal-400 mb-2 group-hover:text-teal-300 transition-colors animate-count-up">1,500+</div>
              <div className="text-teal-300 group-hover:text-white transition-colors">Active Users</div>
            </div>
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer animation-delay-600">
              <div className="text-4xl font-bold text-cyan-400 mb-2 group-hover:text-cyan-300 transition-colors animate-count-up">Rs.750K+</div>
              <div className="text-cyan-300 group-hover:text-white transition-colors">Earned by Users</div>
            </div>
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer animation-delay-900">
              <div className="text-4xl font-bold text-emerald-500 mb-2 group-hover:text-emerald-400 transition-colors animate-count-up">50+</div>
              <div className="text-emerald-300 group-hover:text-white transition-colors">Partner Locations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Always Visible */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6 transform transition-all duration-1000 opacity-0 animate-fade-in-up">
            Start Your Eco-Friendly Journey Today
          </h2>
          <p className="text-xl mb-8 text-emerald-100 transform transition-all duration-1000 delay-300 opacity-0 animate-fade-in-up">
            Join the movement that's transforming waste management in Sri Lanka. 
            Every piece of trash you recycle helps build a cleaner, greener future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 delay-500 opacity-0 animate-fade-in-up">
            <Link
              to="/register"
              className="group bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden"
            >
              <span className="relative z-10">Get Started for Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
            <Link
              to="/login"
              className="group border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-emerald-800 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10">I Have an Account</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
