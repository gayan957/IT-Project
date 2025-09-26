export default function DashboardSupport() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600 mt-2">
          Get help with your account, recycling questions, and technical issues
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
          <p className="text-gray-600 text-sm">Chat with our support team</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
          <p className="text-gray-600 text-sm">Send us a detailed message</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
          <p className="text-gray-600 text-sm">Call us directly</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">FAQ</h3>
          <p className="text-gray-600 text-sm">Browse common questions</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-gray-600">support@trash2cash.lk</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-green-500 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <p className="text-gray-600">+94 11 234 5678</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-purple-500 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Hours</p>
              <p className="text-gray-600">Mon-Fri: 8AM-6PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              question: "How do I register a new recycling bin?",
              answer: "Go to the 'My Bins' section in your dashboard and click 'Add New Bin'. Fill in the location details and waste type information."
            },
            {
              question: "When will I receive payment for my recycled waste?",
              answer: "Payments are processed within 24-48 hours after waste collection and verification. You'll receive a notification once payment is credited."
            },
            {
              question: "What types of waste can I recycle for money?",
              answer: "We accept plastic bottles, paper products, glass containers, metal cans, e-waste, and organic materials. Check our rewards page for current rates."
            },
            {
              question: "How do I schedule a pickup?",
              answer: "Pickups are automatically scheduled when your bin reaches 80% capacity. You can also manually request pickup through the app."
            },
            {
              question: "Can I change my bin location?",
              answer: "Yes, you can update your bin location through the 'My Bins' section. Make sure to provide accurate GPS coordinates."
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Ticket */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Ticket</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">Select category</option>
                <option value="billing">Billing & Payments</option>
                <option value="technical">Technical Issues</option>
                <option value="pickup">Pickup Problems</option>
                <option value="account">Account Management</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Please describe your issue in detail..."
            ></textarea>
          </div>
          <button 
            type="submit"
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-colors"
          >
            Submit Ticket
          </button>
        </form>
      </div>
    </div>
  );
}
