import React, { Fragment, useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    DollarSign,
    BarChart3,
    Settings,
    X,
    Dumbbell,
    ChevronDown,
    Briefcase,
    Calendar,
    History,
} from 'lucide-react';
import { UserRole } from '../types';

// FIX: Added NavItem interface to properly type navigation items.
interface NavItem {
    to: string;
    icon: React.ForwardRefExoticComponent<any>;
    text: string;
    subItems?: { to: string; text: string }[];
}

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    currentUserRole: UserRole;
}

const adminNavItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/manage', icon: Briefcase, text: 'Manage', subItems: [
        { to: '/manage/customers', text: 'Customers' },
        { to: '/manage/trainers', text: 'Trainers' },
        { to: '/manage/packages', text: 'Packages' },
    ]},
    { to: '/financial', icon: DollarSign, text: 'Finance', subItems: [
        { to: '/financial/trainer-payouts', text: 'Trainer Payouts' },
        { to: '/financial/payment-history', text: 'Payment History' },
        { to: '/financial/payout-history', text: 'Payout History' },
    ]},
    { to: '/analytics', icon: BarChart3, text: 'Analytics', subItems: [
        { to: '/analytics/overview', text: 'Studio Overview' },
        { to: '/analytics/trainer-report', text: 'Trainer Report' },
        { to: '/analytics/customer-report', text: 'Customer Report' },
    ]},
];

const trainerNavItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/my-schedule', icon: Calendar, text: 'My Schedule' },
    { to: '/my-payouts', icon: History, text: 'My Payouts' },
];

const settingsItem: Omit<NavItem, 'subItems'> = { to: '/settings', icon: Settings, text: 'Settings' };

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, currentUserRole }) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

    const navItems = currentUserRole === UserRole.Admin ? adminNavItems : trainerNavItems;

    useEffect(() => {
        const activeParent = navItems.find(item => item.subItems && location.pathname.startsWith(item.to));
        if (activeParent) {
            setOpenMenus(prev => new Set(prev).add(activeParent.text));
        }
    }, [location.pathname, navItems]);

    const toggleMenu = (menuText: string) => {
        setOpenMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuText)) {
                newSet.delete(menuText);
            } else {
                newSet.add(menuText);
            }
            return newSet;
        });
    };

    return (
        <Fragment>
            {/* Mobile overlay */}
            <div className={`fixed inset-0 z-20 bg-black opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-white border-r transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div>
                        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                            <Link to="/" className="text-xl font-bold text-blue-600 flex items-center">
                                <Dumbbell className="mr-2" />
                                <span>StudioFlow</span>
                            </Link>
                            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 focus:outline-none">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="p-4">
                            {navItems.map(item => {
                                if (item.subItems) {
                                    const isOpen = openMenus.has(item.text);
                                    const isActiveParent = location.pathname.startsWith(item.to);
                                    return (
                                        <div key={item.text} className="mt-2">
                                            <button
                                                onClick={() => toggleMenu(item.text)}
                                                className={`flex items-center justify-between w-full px-4 py-2 text-sm rounded-md transition-colors duration-200 ${isActiveParent ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                <div className="flex items-center">
                                                    <item.icon className="w-5 h-5 mr-3" />
                                                    <span>{item.text}</span>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen && (
                                                <div className="pl-6 mt-1 space-y-1">
                                                    {item.subItems.map(subItem => (
                                                        <NavLink
                                                            key={subItem.to}
                                                            to={subItem.to}
                                                            className={({ isActive }) => `flex items-center w-full px-4 py-2 text-sm rounded-md transition-colors duration-200 ${isActive ? 'font-semibold text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                                                            onClick={() => setSidebarOpen(false)}
                                                        >
                                                            {subItem.text}
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return (
                                    <NavLink
                                        key={item.text}
                                        to={item.to}
                                        className={({ isActive }) => `flex items-center px-4 py-2 mt-2 text-sm rounded-md transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.text}
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>
                    {currentUserRole === UserRole.Admin && (
                        <div className="mt-auto p-4 border-t">
                            <NavLink
                                to={settingsItem.to}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm rounded-md transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <settingsItem.icon className="w-5 h-5 mr-3" />
                                {settingsItem.text}
                            </NavLink>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
};

export default Sidebar;