import { useState } from 'react';
import ScheduleForm from '../components/ScheduleForm';
import ScheduleList from '../components/ScheduleList';

export default function DashboardSchedules() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Simple Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pickup Schedules</h1>
        </div>

        {/* Schedule Form Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <div className="bg-teal-600 rounded-lg p-3 mb-4 inline-block">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Schedule Pickup</h2>
              <p className="text-gray-600 text-sm">Plan your waste collection efficiently</p>
            </div>
            <ScheduleForm onCreated={handleScheduleCreated} />
          </div>
        </div>

        {/* Schedule List Section */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <div className="bg-teal-600 rounded-lg p-2 mb-4 inline-block">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h5.586a1 1 0 00.707-.293l5.414-5.414a1 1 0 00.293-.707V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Schedules</h3>
              <p className="text-sm text-gray-600">Manage your waste pickup timeline</p>
            </div>
            <ScheduleList key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
