

import React, { useState } from 'react';
import { ClipboardList, CalendarCheck, PackageX, Users, Plus, Package as PackageIcon } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import RecentBookings from '../components/dashboard/RecentBookings';
import Calendar from '../components/dashboard/Calendar';
import { useStudioData } from '../hooks/useStudioData';
import BookingModal from '../components/BookingModal';
import WelcomeGuide from '../components/dashboard/WelcomeGuide';
import { Booking } from '../types';
import NewCustomerFlowModal from '../components/NewCustomerFlowModal';
import PackageModal from '../components/PackageModal';
import { isSameDay } from 'date-fns/isSameDay';

const DashboardPage: React.FC = () => {
    const { bookings, customers, now } = useStudioData();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    
    // Check if the studio is empty to show the welcome guide
    const isNewStudio = customers.length === 0 && bookings.length === 0;

    // KPI Calculations
    const today = now;
    const activeBookings = bookings.filter(b => b.status === 'Booked').length;
    const todaysSessions = bookings.filter(b => isSameDay(new Date(b.dateTime), today) && (b.status === 'Booked' || b.status === 'Completed')).length;
    const expiringPackages = customers.flatMap(c => c.packages).filter(p => !p.isArchived && p.sessionsRemaining > 0 && new Date(p.expirationDate).getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000).length;
    const customerEngagement = 82; // Hardcoded % for demo

    const handleOpenBookingModalForNew = (date?: Date) => {
        setSelectedBooking(null);
        setSelectedDateTime(date || new Date());
        setIsBookingModalOpen(true);
    };

    const handleOpenBookingModalForEdit = (booking: Booking) => {
        setSelectedBooking(booking);
        setSelectedDateTime(null);
        setIsBookingModalOpen(true);
    };

    const closeAllModals = () => {
        setIsBookingModalOpen(false);
        setIsCustomerModalOpen(false);
        setIsPackageModalOpen(false);
        setSelectedBooking(null);
        setSelectedDateTime(null);
    };

    const handleFabAction = (action: 'booking' | 'customer' | 'package') => {
        if (action === 'booking') {
            handleOpenBookingModalForNew();
        } else if (action === 'customer') {
            setIsCustomerModalOpen(true);
        } else if (action === 'package') {
            setIsPackageModalOpen(true);
        }
        setIsFabMenuOpen(false);
    };


  return (
    <>
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                {!isNewStudio && (
                  <div className="flex flex-wrap items-center gap-2">
                      <button
                          onClick={() => setIsCustomerModalOpen(true)}
                          className="hidden lg:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                      >
                          <Users size={16} className="mr-2" />
                          Add Customer
                      </button>
                      <button
                          onClick={() => setIsPackageModalOpen(true)}
                          className="hidden lg:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                      >
                          <PackageIcon size={16} className="mr-2" />
                          Add Package
                      </button>
                      <button
                          onClick={() => handleOpenBookingModalForNew()}
                          className="hidden lg:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                      >
                          <Plus size={16} className="mr-2" />
                          New Booking
                      </button>
                  </div>
                )}
            </div>
          
          {isNewStudio ? <WelcomeGuide /> : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Active Bookings" value={activeBookings} icon={CalendarCheck} />
                <KpiCard title="Today's Sessions" value={todaysSessions} icon={ClipboardList} />
                <KpiCard title="Expiring Packages" value={expiringPackages} icon={PackageX} />
                <KpiCard title="Customer Engagement" value={`${customerEngagement}%`} icon={Users} />
              </div>

              {/* Main Content: Calendar */}
              <div>
                <Calendar onCellClick={handleOpenBookingModalForNew} onBookingClick={handleOpenBookingModalForEdit} />
              </div>
              
              {/* Recent Bookings & Alerts */}
              <div>
                <RecentBookings />
              </div>
            </>
          )}
        </div>
        
        {/* Mobile FAB and Menu */}
        <div className="lg:hidden fixed bottom-6 right-6 z-30">
            <div className={`flex flex-col items-end gap-4 mb-4 transition-all duration-300 ease-in-out ${isFabMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                 {/* Add Package */}
                 <div className="flex items-center">
                    <span className="mr-3 px-3 py-1.5 bg-white text-gray-700 text-sm font-semibold rounded-md shadow-sm">
                        Add Package
                    </span>
                    <button
                        onClick={() => handleFabAction('package')}
                        className="flex items-center justify-center w-12 h-12 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100"
                        aria-label="Add Package"
                    >
                        <PackageIcon size={24} />
                    </button>
                </div>
                 {/* Add Customer */}
                 <div className="flex items-center">
                    <span className="mr-3 px-3 py-1.5 bg-white text-gray-700 text-sm font-semibold rounded-md shadow-sm">
                        Add Customer
                    </span>
                    <button
                        onClick={() => handleFabAction('customer')}
                        className="flex items-center justify-center w-12 h-12 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100"
                        aria-label="Add Customer"
                    >
                        <Users size={24} />
                    </button>
                </div>
                {/* New Booking */}
                <div className="flex items-center">
                    <span className="mr-3 px-3 py-1.5 bg-white text-gray-700 text-sm font-semibold rounded-md shadow-sm">
                        New Booking
                    </span>
                    <button
                        onClick={() => handleFabAction('booking')}
                        className="flex items-center justify-center w-12 h-12 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100"
                        aria-label="New Booking"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

             <div className="flex justify-end">
                <button
                    onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                    className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={isFabMenuOpen ? "Close actions menu" : "Open actions menu"}
                >
                    <Plus size={28} className={`transition-transform duration-300 ${isFabMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
                </button>
            </div>
        </div>
        
        {/* Overlay for FAB menu */}
        {isFabMenuOpen && (
             <div
                className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-20"
                onClick={() => setIsFabMenuOpen(false)}
            ></div>
        )}

        <BookingModal 
            isOpen={isBookingModalOpen} 
            onClose={closeAllModals} 
            booking={selectedBooking} 
            selectedDateTime={selectedDateTime} 
        />
        <NewCustomerFlowModal 
            isOpen={isCustomerModalOpen}
            onClose={closeAllModals}
        />
        <PackageModal
            isOpen={isPackageModalOpen}
            onClose={closeAllModals}
            pkg={null}
        />
    </>
  );
};

export default DashboardPage;