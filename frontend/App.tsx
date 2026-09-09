/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import CitizenApp from './components/CitizenApp';
import AdminDashboard from './components/AdminDashboard';
import { Smartphone, Monitor, Shield, Users } from 'lucide-react';
import { motion } from 'motion/react';

type Role = 'none' | 'citizen' | 'admin';

export default function App() {
  const [role, setRole] = useState<Role>('none');

  const handleLogout = () => {
    setRole('none');
  };

  return (
    <>
      {role === 'none' ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-inter">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Welcome to Civic Connect</h1>
              <p className="text-lg text-gray-600">Select your portal to continue into the application.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Citizen Card */}
              <button 
                onClick={() => setRole('citizen')} 
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-[#2E7D32] transition-all group text-left flex flex-col h-full cursor-pointer"
              >
                <div className="w-16 h-16 bg-green-50 text-[#2E7D32] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2E7D32] group-hover:text-white transition-all duration-300">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Citizen Portal</h2>
                <p className="text-gray-600 flex-1 leading-relaxed text-sm">
                  Empowering citizens to report civic infrastructure issues instantly. Snap a photo of a hazard, and our AI automatically categorizes and routes it to the correct department. Optimized for mobile devices.
                </p>
                <div className="mt-6 font-semibold text-[#2E7D32] flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Enter Mobile App &rarr;
                </div>
              </button>
              
              {/* Admin Card */}
              <button 
                onClick={() => setRole('admin')} 
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-[#FFC107] transition-all group text-left flex flex-col h-full cursor-pointer"
              >
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#FFC107] group-hover:text-gray-900 transition-all duration-300">
                  <Shield className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Municipal Dashboard</h2>
                <p className="text-gray-600 flex-1 leading-relaxed text-sm">
                  A data-driven command center for urban planners. Track active reports on a live interactive map, triage high-priority issues, and manage operational workflows dynamically. Desktop optimized.
                </p>
                <div className="mt-6 font-semibold text-amber-600 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Enter Dashboard &rarr;
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-900 flex flex-col font-inter">
          <div className="flex-1 w-full relative overflow-hidden bg-gray-100">
            {role === 'citizen' ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-200/50 p-0 sm:p-6">
                {/* Mobile Device Frame Simulation on Desktop */}
                <div className="w-full h-full sm:h-[800px] sm:w-[400px] sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden bg-white relative ring-1 ring-gray-900/5">
                  <CitizenApp onLogout={handleLogout} />
                </div>
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto">
                <AdminDashboard onLogout={handleLogout} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
