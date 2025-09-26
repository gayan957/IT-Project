import { useState } from "react";
import UserDetails from "../components/UserDetails";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function DashboardProfile() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout } = useAuth();

  const deleteAccount = async () => {
    if (!confirm("⚠️ This will permanently delete your account and all associated data. This action cannot be undone. Are you sure you want to continue?")) return;
    
    setIsDeleting(true);
    try {
      await api.delete("/api/users/me");
      logout();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and account preferences
          </p>
        </div>

        <button
          onClick={deleteAccount}
          disabled={isDeleting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deleting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </>
          )}
        </button>
      </div>

      {/* User Details Component */}
      <UserDetails />

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Account Security</h3>
              <p className="text-blue-700 text-sm mt-1">
                Your account is protected with industry-standard security measures. 
                Contact support if you notice any suspicious activity.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Info */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-green-500 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Privacy Protection</h3>
              <p className="text-green-700 text-sm mt-1">
                Your personal data is encrypted and never shared with third parties. 
                You have full control over your information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="bg-amber-500 rounded-full p-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">Location Settings</h3>
            <p className="text-amber-700 text-sm mt-1">
              Your default location is used for new bin registrations. 
              Make sure to update it if you move to ensure accurate pickup scheduling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
