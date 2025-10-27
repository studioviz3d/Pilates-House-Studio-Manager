import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

const StudioSetupGate: React.FC = () => {
  const { user, studioId, loading } = useAuth();
  const navigate = useNavigate();
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    // FIX: Changed NodeJS.Timeout to number for browser compatibility.
    let interval: number | undefined;

    // If the user is logged in but has no studioId after initial load,
    // it's likely a new user whose claims are still being processed.
    if (!loading && user && !studioId) {
      // Poll for the token with updated claims.
      // FIX: Use window.setInterval to avoid type conflicts with NodeJS.Timeout.
      interval = window.setInterval(async () => {
        await user.getIdTokenResult(true); // Force refresh
        setRetries(r => r + 1);
      }, 2000); // Check every 2 seconds
    }
    
    // If we have a studioId, we're good to go.
    if (studioId) {
      if(interval) window.clearInterval(interval);
    }
    
    // Stop polling after 10 retries (20 seconds) to prevent infinite loops.
    if (retries > 10) {
      window.clearInterval(interval);
      // Optional: Log out the user or show an error message
      console.error("Failed to retrieve studio setup after 20 seconds.");
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [loading, user, studioId, retries, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  // Show a setup screen while we wait for the studioId claim.
  if (user && !studioId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-center">
        <div>
            <Spinner className="w-12 h-12 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-800">Setting up your studio...</h1>
            <p className="mt-2 text-gray-600">This will just take a moment. Please don't refresh the page.</p>
        </div>
      </div>
    );
  }

  // If everything is loaded and we have a studioId, render the rest of the app.
  return <Outlet />;
};

export default StudioSetupGate;