export default function DashboardRewards() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rewards Center</h1>
        <p className="text-gray-600 mt-2">
          Track your earnings and redeem rewards for your recycling efforts
        </p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-lg">Current Balance</p>
            <p className="text-5xl font-bold mb-2">Rs. 2,340</p>
            <p className="text-green-100">+Rs. 150 this week</p>
          </div>
          <div className="bg-white/20 rounded-full p-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div className="flex space-x-4 mt-6">
          <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Withdraw Funds
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
            View History
          </button>
        </div>
      </div>

      {/* Earning Methods */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Earn More</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "♻️",
              title: "Plastic Recycling",
              rate: "Rs. 60/kg",
              description: "Bottles, containers, packaging materials"
            },
            {
              icon: "📄",
              title: "Paper Recycling",
              rate: "Rs. 40/kg",
              description: "Newspapers, cardboard, office paper"
            },
            {
              icon: "🥤",
              title: "Glass Recycling",
              rate: "Rs. 80/kg",
              description: "Bottles, jars, containers"
            },
            {
              icon: "🔧",
              title: "Metal Recycling",
              rate: "Rs. 120/kg",
              description: "Aluminum cans, steel containers"
            },
            {
              icon: "📱",
              title: "E-Waste",
              rate: "Rs. 200/kg",
              description: "Electronics, batteries, components"
            },
            {
              icon: "🌱",
              title: "Organic Waste",
              rate: "Rs. 20/kg",
              description: "Compostable materials"
            }
          ].map((method, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">{method.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-2xl font-bold text-green-600 mb-3">{method.rate}</p>
                <p className="text-gray-600 text-sm">{method.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Earnings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Earnings</h3>
        <div className="space-y-4">
          {[
            { date: "2024-09-01", type: "Plastic Recycling", amount: "Rs. 150", weight: "2.5 kg", status: "completed" },
            { date: "2024-08-30", type: "Paper Recycling", amount: "Rs. 48", weight: "1.2 kg", status: "completed" },
            { date: "2024-08-28", type: "Glass Recycling", amount: "Rs. 64", weight: "0.8 kg", status: "completed" },
            { date: "2024-08-26", type: "Metal Recycling", amount: "Rs. 240", weight: "2.0 kg", status: "completed" },
            { date: "2024-08-25", type: "E-Waste", amount: "Rs. 400", weight: "2.0 kg", status: "pending" },
          ].map((earning, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{earning.type}</p>
                <p className="text-sm text-gray-500">{earning.date} • {earning.weight}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{earning.amount}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  earning.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {earning.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Achievement Milestones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl mb-2">🏆</div>
            <h4 className="font-semibold text-green-900">Eco Warrior</h4>
            <p className="text-sm text-green-700 mt-1">Recycled 50kg+ this month</p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-3">
              <div className="bg-green-600 h-2 rounded-full" style={{width: '90%'}}></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-semibold text-blue-900">Money Maker</h4>
            <p className="text-sm text-blue-700 mt-1">Earned Rs. 5000+ total</p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '47%'}}></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-3xl mb-2">🌟</div>
            <h4 className="font-semibold text-purple-900">Consistency King</h4>
            <p className="text-sm text-purple-700 mt-1">30 days active streak</p>
            <div className="w-full bg-purple-200 rounded-full h-2 mt-3">
              <div className="bg-purple-600 h-2 rounded-full" style={{width: '73%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
