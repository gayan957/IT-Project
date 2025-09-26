import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    console.log('App component mounted');
  }, []);

  // Check if current path is an admin route or pickup agent route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPickupAgentRoute = location.pathname.startsWith('/pickup-agent');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Only show global header if not on admin or pickup agent routes */}
      {!isAdminRoute && !isPickupAgentRoute && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Only show footer if not on admin or pickup agent routes */}
      {!isAdminRoute && !isPickupAgentRoute && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
}