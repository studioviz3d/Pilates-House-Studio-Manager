

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStudioData } from '../hooks/useStudioData';
import Card from '../components/ui/Card';
import CustomerModal from '../components/CustomerModal';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Archive, ArchiveRestore, Trash2, Mail, Phone, Package as PackageIcon, Calendar, AlertTriangle, FilePenLine, Users } from 'lucide-react';
import { Customer, Booking, BookingStatus } from '../types';
import { formatPhoneNumber, formatDateTime } from '../utils';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import NewCustomerFlowModal from '../components/NewCustomerFlowModal';
import Select, { SelectOption } from '../components/ui/Select';
import { differenceInDays } from 'date-fns/differenceInDays';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const ActivityStatusBadge: React.FC<{ lastActivityDate: Date | null, thresholdDays: number }> = ({ lastActivityDate, thresholdDays }) => {
    const now = new Date();
    
    if (!lastActivityDate) {
        return <span title="No session history" className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">No Activity</span>;
    }

    const daysSinceLastActivity = differenceInDays(now, lastActivityDate);
    const isActive = daysSinceLastActivity <= thresholdDays;

    if (isActive) {
        return (
            <span title={`Last active: ${formatDistanceToNow(lastActivityDate)} ago`} className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Active
            </span>
        );
    } else {
        return (
            <span title={`Last active: ${formatDistanceToNow(lastActivityDate)} ago`} className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Inactive
            </span>
        );
    }
};

const CustomerCardActions: React.FC<{ customer: Customer; onEdit: (c: Customer) => void; onArchive: (id: string) => void; onUnarchive: (id: string) => void; onDelete: (id: string, name: string) => void; }> = 
    ({ customer, onEdit, onArchive, onUnarchive, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const customerName = `${customer.firstName} ${customer.lastName}`;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full">
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                    {customer.isArchived ? (
                        <>
                            <button onClick={() => { onUnarchive(customer.id); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                <ArchiveRestore size={14} className="mr-2" /> Unarchive
                            </button>
                             <button onClick={() => { onDelete(customer.id, customerName); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                <Trash2 size={14} className="mr-2" /> Delete Permanently
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { onEdit(customer); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                <FilePenLine size={14} className="mr-2" /> Edit
                            </button>
                             <button onClick={() => { onArchive(customer.id); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                <Archive size={14} className="mr-2" /> Archive
                            </button>
                        </>
                    )}
                 </div>
            )}
        </div>
    );
};

interface CustomerCardProps {
    customer: Customer & { lastActivityDate: Date | null };
    debtsCount: number;
    nextBooking: Booking | undefined;
    onEdit: (customer: Customer) => void;
    onArchive: (id: string) => void;
    onUnarchive: (id: string) => void;
    onDelete: (id: string, name: string) => void;
    inactivityThresholdDays: number;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, debtsCount, nextBooking, onEdit, onArchive, onUnarchive, onDelete, inactivityThresholdDays }) => {
    const activePackagesCount = customer.packages.filter(p => !p.isArchived).length;
    
    return (
        <Card className="flex flex-col justify-between transition-shadow hover:shadow-lg">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <img className="h-12 w-12 rounded-full object-cover" src={customer.avatarUrl} alt="" />
                        <div>
                            <Link to={`/manage/customers/${customer.id}`} className="text-lg font-bold text-gray-800 hover:text-blue-600">
                                {customer.firstName} {customer.lastName}
                            </Link>
                             <div className="mt-1">
                                <ActivityStatusBadge lastActivityDate={customer.lastActivityDate} thresholdDays={inactivityThresholdDays} />
                             </div>
                        </div>
                    </div>
                    <CustomerCardActions 
                        customer={customer}
                        onEdit={onEdit}
                        onArchive={onArchive}
                        onUnarchive={onUnarchive}
                        onDelete={onDelete}
                    />
                </div>
                 {debtsCount > 0 && (
                     <div className="mt-4 p-2 rounded-md flex items-center bg-red-100 text-red-800 text-sm font-medium">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        <span>{debtsCount} Owed Session{debtsCount > 1 ? 's' : ''}</span>
                    </div>
                 )}
                 <div className="mt-4 space-y-3 text-sm border-t pt-4">
                    <div className="flex items-center text-gray-600 gap-3">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600 gap-3">
                        <Phone size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{formatPhoneNumber(customer.phone)}</span>
                    </div>
                    <div className="flex items-center text-gray-600 gap-3">
                        <PackageIcon size={16} className="text-gray-400 flex-shrink-0" />
                        <span>{activePackagesCount} Active Package{activePackagesCount !== 1 && 's'}</span>
                    </div>
                     <div className="flex items-center text-gray-600 gap-3">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                           Next Session: {nextBooking ? formatDateTime(nextBooking.dateTime) : 'None scheduled'}
                        </span>
                    </div>
                 </div>
            </div>
            <div className="mt-6">
                 <Link to={`/manage/customers/${customer.id}`} className="w-full block text-center px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-transparent rounded-md hover:bg-blue-100">
                    View Details
                </Link>
            </div>
        </Card>
    )
};


const CustomersPage: React.FC = () => {
    const { customers, getSessionDebtsForCustomer, archiveCustomer, unarchiveCustomer, deleteCustomer, bookings, now, studioSettings } = useStudioData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter and Sort states
    const [filter, setFilter] = useState<'current' | 'all' | 'archived' | 'with-debt' | 'active' | 'inactive'>('current');
    const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'last-session-newest' | 'last-session-oldest'>('name-asc');
    
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
    
    const filterOptions: SelectOption[] = [
        { value: 'current', label: 'Current Customers' },
        { value: 'active', label: 'Active (Recent Session)' },
        { value: 'inactive', label: 'Inactive (No Recent Session)' },
        { value: 'with-debt', label: 'With Debt' },
        { value: 'all', label: 'All Customers (incl. Archived)' },
        { value: 'archived', label: 'Archived Only' },
    ];
    
    const sortOptions: SelectOption[] = [
        { value: 'name-asc', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' },
        { value: 'last-session-newest', label: 'Last Session: Newest' },
        { value: 'last-session-oldest', label: 'Last Session: Oldest' },
    ];
    
    const upcomingBookingsByCustomer = useMemo(() => {
        const map = new Map<string, Booking>();
        const sortedUpcoming = bookings
            .filter(b => b.status === BookingStatus.Booked && new Date(b.dateTime) >= now)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        for (const booking of sortedUpcoming) {
            for (const customerId of booking.customerIds) {
                if (!map.has(customerId)) {
                    map.set(customerId, booking);
                }
            }
        }
        return map;
    }, [bookings, now]);


    const filteredAndSortedCustomers = useMemo<Array<Customer & { lastActivityDate: Date | null }>>(() => {
        // 1. Augment customers with last activity date
        const customersWithActivity = customers.map(customer => {
            const customerBookings = bookings.filter(b => 
                b.customerIds.includes(customer.id) &&
                (b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate)
            );
            
            if (customerBookings.length === 0) {
                return { ...customer, lastActivityDate: null };
            }

            const lastActivityDate = new Date(Math.max(...customerBookings.map(b => new Date(b.dateTime).getTime())));
            return { ...customer, lastActivityDate };
        });

        // 2. Filter
        let filtered = customersWithActivity.filter(customer => {
            const searchMatch = searchTerm === '' ||
                `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase());

            if (!searchMatch) return false;

            switch (filter) {
                case 'current':
                    return !customer.isArchived;
                case 'archived':
                    return customer.isArchived;
                case 'with-debt':
                    return !customer.isArchived && getSessionDebtsForCustomer(customer.id).length > 0;
                case 'active':
                    if (customer.isArchived || !customer.lastActivityDate) return false;
                    return differenceInDays(now, customer.lastActivityDate) <= studioSettings.inactivityThresholdDays;
                case 'inactive':
                    if (customer.isArchived) return false;
                    if (!customer.lastActivityDate) return true; // Include customers with no activity yet
                    return differenceInDays(now, customer.lastActivityDate) > studioSettings.inactivityThresholdDays;
                case 'all':
                default:
                    return true;
            }
        });

        // 3. Sort
        return filtered.sort((a, b) => {
            switch (sort) {
                case 'name-asc':
                    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                case 'name-desc':
                    return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
                case 'last-session-newest': {
                    const dateA = a.lastActivityDate ? a.lastActivityDate.getTime() : 0;
                    const dateB = b.lastActivityDate ? b.lastActivityDate.getTime() : 0;
                    return dateB - dateA;
                }
                case 'last-session-oldest': {
                    const dateA = a.lastActivityDate ? a.lastActivityDate.getTime() : Infinity;
                    const dateB = b.lastActivityDate ? b.lastActivityDate.getTime() : Infinity;
                    return dateA - dateB;
                }
                default:
                    return 0;
            }
        });
    }, [customers, bookings, searchTerm, filter, sort, getSessionDebtsForCustomer, now, studioSettings.inactivityThresholdDays]);
    
    const {
        currentPageData: paginatedCustomers,
        currentPage,
        totalPages,
        setCurrentPage,
        itemsPerPage,
        totalItems,
    } = usePagination(filteredAndSortedCustomers, 9);

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setIsAddModalOpen(true);
    };

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsEditModalOpen(true);
    };
    
    const handleDeleteCustomer = (id: string, name: string) => {
        setConfirmDelete({ id, name });
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">Customers</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                         <div className="w-full sm:w-56">
                            <Select
                                options={filterOptions}
                                value={filter}
                                onChange={(val) => setFilter(val as any)}
                                labelPrefix="Filter by:"
                            />
                        </div>
                        <div className="w-full sm:w-56">
                            <Select
                                options={sortOptions}
                                value={sort}
                                onChange={(val) => setSort(val as any)}
                                labelPrefix="Sort by:"
                            />
                        </div>
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleAddCustomer}
                            className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                            <Plus size={16} className="mr-2" />
                            Add Customer
                        </button>
                    </div>
                </div>

                {paginatedCustomers.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedCustomers.map((customer: Customer & { lastActivityDate: Date | null }) => {
                            const debts = getSessionDebtsForCustomer(customer.id);
                            const nextBooking = upcomingBookingsByCustomer.get(customer.id);
                            return (
                                <CustomerCard 
                                    key={customer.id}
                                    customer={customer}
                                    debtsCount={debts.length}
                                    nextBooking={nextBooking}
                                    onEdit={handleEditCustomer}
                                    onArchive={archiveCustomer}
                                    onUnarchive={unarchiveCustomer}
                                    onDelete={handleDeleteCustomer}
                                    inactivityThresholdDays={studioSettings.inactivityThresholdDays}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                            <p className="mt-1 text-sm text-gray-500">No customers match the current search or filter criteria.</p>
                        </div>
                    </Card>
                )}
                
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                />
            </div>
            <NewCustomerFlowModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
            <CustomerModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                customer={selectedCustomer}
            />
             <ConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete) {
                        deleteCustomer(confirmDelete.id);
                    }
                }}
                title="Delete Customer"
            >
                Are you sure you want to permanently delete {confirmDelete?.name}? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default CustomersPage;