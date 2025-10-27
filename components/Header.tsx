

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, UserSquare, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { useStudioData } from '../hooks/useStudioData';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { isBefore } from 'date-fns/isBefore';
import { subDays } from 'date-fns/subDays';
import { formatDateTime } from '../utils';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

interface SearchResult {
    type: 'customer' | 'trainer' | 'booking';
    id: string;
    label: string;
    details: string;
    link: string;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
    const { alerts, notifications, customers, trainers, bookings, getTrainer, getCustomer, markNotificationsAsRead, getClassType } = useStudioData();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'alerts' | 'updates'>('alerts');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    const totalUnreadCount = alerts.length + unreadNotificationsCount;

    useEffect(() => {
        if (alerts.length === 0 && unreadNotificationsCount > 0) {
            setActiveTab('updates');
        } else {
            setActiveTab('alerts');
        }
    }, [notificationsOpen, alerts.length, unreadNotificationsCount]);

    const handleBellClick = () => {
        setNotificationsOpen(!notificationsOpen);
        if (!notificationsOpen) {
            markNotificationsAsRead();
        }
    };
    
    useEffect(() => {
        const handleSearch = () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                setIsResultsOpen(false);
                return;
            }

            const lowerCaseTerm = searchTerm.toLowerCase();
            const results: SearchResult[] = [];
            
            customers
                .filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerCaseTerm))
                .forEach(c => results.push({ type: 'customer', id: c.id, label: `${c.firstName} ${c.lastName}`, details: 'Customer', link: `/manage/customers/${c.id}` }));

            trainers
                .filter(t => `${t.firstName} ${t.lastName}`.toLowerCase().includes(lowerCaseTerm))
                .forEach(t => results.push({ type: 'trainer', id: t.id, label: `${t.firstName} ${t.lastName}`, details: 'Trainer', link: `/manage/trainers/${t.id}` }));

            bookings
                .filter(b => {
                    const trainer = getTrainer(b.trainerId);
                    const trainerName = trainer ? `${trainer.firstName} ${trainer.lastName}`.toLowerCase() : '';
                    const customerNames = b.customerIds.map(id => {
                        const customer = getCustomer(id);
                        return customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
                    }).join(' ');
                    return trainerName.includes(lowerCaseTerm) || customerNames.includes(lowerCaseTerm);
                })
                .forEach(b => {
                    const trainer = getTrainer(b.trainerId);
                    const classType = getClassType(b.classTypeId);
                    results.push({ type: 'booking', id: b.id, label: `${classType?.name || 'Class'} on ${formatDateTime(b.dateTime)}`, details: `w/ ${trainer ? `${trainer.firstName} ${trainer.lastName}` : ''}`, link: `/dashboard` });
                });
            
            setSearchResults(results);
            setIsResultsOpen(true);
        };

        const debounceTimer = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounceTimer);

    }, [searchTerm, customers, trainers, bookings, getTrainer, getCustomer, getClassType]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsResultsOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setNotificationsOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = () => {
        setSearchTerm('');
        setIsResultsOpen(false);
    }
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none lg:hidden"><Menu className="w-6 h-6" /></button>
        <div className="relative mx-4 lg:mx-0" ref={searchRef}>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-5 h-5 text-gray-400" /></span>
          <input className="w-32 pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 bg-gray-100 border border-transparent rounded-md sm:w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onFocus={() => searchTerm.length > 1 && setIsResultsOpen(true)} />
          {isResultsOpen && (
            <div className="absolute mt-2 w-full sm:w-80 bg-white rounded-lg shadow-xl overflow-hidden z-20">
              <div className="max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <Link to={result.link} key={`${result.type}-${result.id}`} onClick={handleResultClick} className="flex items-center p-3 text-sm text-gray-600 hover:bg-gray-100">
                      {result.type === 'customer' && <User className="w-5 h-5 mr-3 text-gray-400"/>}
                      {result.type === 'trainer' && <UserSquare className="w-5 h-5 mr-3 text-gray-400"/>}
                      {result.type === 'booking' && <CalendarIcon className="w-5 h-5 mr-3 text-gray-400"/>}
                      <div>
                        <p className="font-semibold text-gray-800">{result.label}</p>
                        <p className="text-xs text-gray-500">{result.details}</p>
                      </div>
                    </Link>
                  ))
                ) : ( <div className="p-3 text-sm text-gray-500">No results found for "{searchTerm}"</div> )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative" ref={notificationsRef}>
            <button onClick={handleBellClick} className="relative text-gray-500 hover:text-gray-700 focus:outline-none">
                <Bell className="w-6 h-6" />
                {totalUnreadCount > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{totalUnreadCount}</span>}
            </button>
            {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-10">
                    <div className="border-b">
                        <div className="flex px-1 pt-1">
                            <button onClick={() => setActiveTab('alerts')} className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 ${activeTab === 'alerts' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:bg-gray-50'}`}>
                                Alerts {alerts.length > 0 && <span className="ml-1 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">{alerts.length}</span>}
                            </button>
                             <button onClick={() => setActiveTab('updates')} className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 ${activeTab === 'updates' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:bg-gray-50'}`}>
                                Updates {unreadNotificationsCount > 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-800 rounded-full px-1.5 py-0.5">{unreadNotificationsCount}</span>}
                            </button>
                        </div>
                    </div>
                    <div className="divide-y max-h-96 overflow-y-auto">
                        {activeTab === 'alerts' && (
                            alerts.length > 0 ? alerts.map(alert => (
                                <div key={alert.id} className="p-3 text-sm transition-colors bg-red-50 hover:bg-red-100">
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 mt-1 mr-3 bg-red-500 rounded-full"></span>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-red-800">{alert.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(alert.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="p-4 text-sm text-gray-500">No new alerts.</p>
                        )}
                        {activeTab === 'updates' && (
                           notifications.length > 0 ? notifications.map(notif => {
                                const customer = getCustomer(notif.customerId);
                                return (
                                <Link to={`/customers/${notif.customerId}`} key={notif.id} className="block p-3 text-sm transition-colors hover:bg-gray-100">
                                    <div className="flex items-start">
                                        {!notif.read && <span className="flex-shrink-0 w-2 h-2 mt-1.5 mr-3 bg-blue-500 rounded-full"></span>}
                                        <div className={`flex-grow ${notif.read ? 'pl-5' : ''}`}>
                                            <p className="font-semibold text-gray-800">{customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}</p>
                                            <p className="text-gray-600">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.timestamp)}</p>
                                        </div>
                                    </div>
                                </Link>
                            )}) : <p className="p-4 text-sm text-gray-500">No customer updates.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
        
        <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center focus:outline-none">
                <img className="object-cover w-8 h-8 rounded-full" src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} alt="Your avatar" />
                <span className="hidden ml-2 text-sm font-semibold md:inline">{user?.displayName || user?.email}</span>
            </button>

            {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20">
                    <div className="py-1">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;