import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-6 shadow-lg">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-block"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-all duration-300 inline-block"
          >
            Login with Different Account
          </Link>
        </div>
      </div>
    </div>
  );
}
