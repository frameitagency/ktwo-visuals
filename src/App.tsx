/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router';
import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabase';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Booking from './pages/Booking';
import Availability from './pages/Availability';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Appointments from './pages/admin/Appointments';
import Services from './pages/admin/Services';
import Packages from './pages/admin/Packages';
import BusinessHours from './pages/admin/BusinessHours';
import BlockedDates from './pages/admin/BlockedDates';
import BusinessSettingsPage from './pages/admin/BusinessSettings';

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-[#fbfbfb] text-[#1a1a1a]">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-[#1a1a1a] p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-light mb-4 text-red-600">Supabase Setup Required</h1>
          <p className="text-gray-600 mb-6 font-light">
            Please configure your Supabase URL and Anon Key. Open the AI Studio settings and bind them as environment variables or secrets: <br /><br />
            <code className="bg-gray-100 p-2 text-xs">VITE_SUPABASE_URL</code><br />
            <code className="bg-gray-100 p-2 text-xs">VITE_SUPABASE_ANON_KEY</code>
          </p>
          <p className="text-sm text-gray-500">
            This will resolve the "Failed to fetch" errors. Once configured, you may need to restart the development server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/availability" element={<Availability />} />
        </Route>
        
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="services" element={<Services />} />
          <Route path="packages" element={<Packages />} />
          <Route path="hours" element={<BusinessHours />} />
          <Route path="blocked-dates" element={<BlockedDates />} />
          <Route path="settings" element={<BusinessSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
