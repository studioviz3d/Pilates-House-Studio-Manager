import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../components/ui/Card';
import { Mail, Phone, Package, Calendar, Edit, ClipboardList, Gift, AlertTriangle, Camera, Archive, ArchiveRestore } from 'lucide-react';
import { isAfter } from 'date-fns/isAfter';
import { BookingStatus, Package as PackageType, Booking } from '../types';
import { formatPhoneNumber, formatDate, formatDateTime } from '../utils';
import CustomerModal from '../components/CustomerModal';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

const statusColors: Record<BookingStatus, string> = {
    [BookingStatus.Booked]: 'bg-blue-100 text-blue-700',
    [BookingStatus.Completed]: 'bg-green-100 text-green-700',
    [BookingStatus.Cancelled]: 'bg-gray-100 text-gray-700',
    [BookingStatus.CancelledLate]: 'bg-yellow-100 text-yellow-700',
    [BookingStatus.Deleted]: 'bg-red-100 text-red-700',
};

const CustomerDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { customers, bookings, getTrainer, getClassType, updateCustomer, getSessionDebtsForCustomer, now, archiveCustomer, unarchiveCustomer } = useStudioData();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const customer = useMemo(() => customers.find(c => c.id === id), [customers, id]);

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [currentNotes, setCurrentNotes] = useState(customer?.notes || '');

    useEffect(() => {
        if (customer) {
            setCurrentNotes(customer.notes || '');
        }
    }, [customer]);

    const handleSaveNotes = () => {
        if(customer) {
            updateCustomer({ ...customer, notes: currentNotes });
        }
        setIsEditingNotes(false);
    };

    const handleCancelNotes = () => {
        if(customer) {
            setCurrentNotes(customer.notes || '');
        }
        setIsEditingNotes(false);
    };
    
    const handleArchive = () => {
        if (customer && window.confirm('Are you sure you want to archive this customer? They will be hidden from the main list.')) {
            archiveCustomer(customer.id);
        }
    }
    const handleUnarchive = () => {
        if (customer) {
            unarchiveCustomer(customer.id);
        }
    }
    
    const sessionDebts = useMemo(() => {
        if (!id) return [];
        return getSessionDebtsForCustomer(id);
    }, [id, getSessionDebtsForCustomer]);
    
    const upcomingBookingsData = useMemo(() => {
        if (!id) return [];
        return bookings
            .filter(b => b.customerIds.includes(id) && b.status === BookingStatus.Booked && new Date(b.dateTime) >= now)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [bookings, id, now]);

    const sessionHistoryData = useMemo(() => {
        if (!id) return [];
        return bookings
            .filter(b => b.customerIds.includes(id) && b.status !== BookingStatus.Booked && b.status !== BookingStatus.Deleted)
            .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [bookings, id]);

    const {
        currentPageData: paginatedUpcoming,
        currentPage: upcomingCurrentPage,
        totalPages: upcomingTotalPages,
        setCurrentPage: setUpcomingCurrentPage
    } = usePagination(upcomingBookingsData, 5);
    
    const {
        currentPageData: paginatedHistory,
        currentPage: historyCurrentPage,
        totalPages: historyTotalPages,
        setCurrentPage: setHistoryCurrentPage
    } = usePagination(sessionHistoryData, 5);

    const firstBookingDate = useMemo(() => {
        if (!id) return null;
        const customerBookings = bookings
            .filter(b => b.customerIds.includes(id))
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        return customerBookings.length > 0 ? new Date(customerBookings[0].dateTime) : null;
    }, [bookings, id]);

    const { activePackages } = useMemo(() => {
        if (!customer) {
            return { activePackages: [] };
        }
        return { 
            activePackages: customer.packages.filter(p => 
                !p.isArchived && isAfter(new Date(p.expirationDate), new Date()) && p.sessionsRemaining > 0
            ) 
        };
    }, [customer]);
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && customer) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateCustomer({ ...customer, avatarUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };


    if (!customer) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-700">Customer not found</h2>
                <Link to="/manage/customers" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Customers List
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                {customer.isArchived && (
                    <div className="p-4 rounded-md bg-yellow-100 border border-yellow-200 text-yellow-800 flex justify-between items-center">
                        <div className="flex items-center">
                            <Archive size={16} className="mr-3" />
                            <p className="text-sm font-medium">This customer is archived and hidden from active lists.</p>
                        </div>
                        <button onClick={handleUnarchive} className="flex items-center px-3 py-1.5 text-sm font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 whitespace-nowrap">
                            <ArchiveRestore size={16} className="mr-2" /> Unarchive
                        </button>
                    </div>
                )}
                 {sessionDebts.length > 0 && (
                    <div className="p-4 rounded-md flex items-center justify-between bg-red-100 border border-red-200">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-3 text-red-600" />
                            <p className="text-sm font-medium text-red-800">
                                This customer has {sessionDebts.length} outstanding session debt{sessionDebts.length > 1 && 's'}.
                            </p>
                        </div>
                        <Link to={`/financial/payment-history?tab=debts&customer=${customer.id}`} className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 whitespace-nowrap">
                            Settle Debt
                        </Link>
                    </div>
                )}
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <img className="h-16 w-16 rounded-full object-cover" src={customer.avatarUrl} alt="" />
                            <label htmlFor="customer-detail-avatar-upload" className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full cursor-pointer transition-opacity">
                                <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </label>
                            <input id="customer-detail-avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{`${customer.firstName} ${customer.lastName}`}</h2>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        {!customer.isArchived && (
                            <button onClick={handleArchive} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                <Archive size={16} className="mr-2" /> Archive
                            </button>
                        )}
                         <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                            <Edit size={16} className="mr-2" />
                            Edit Customer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-gray-400"/>
                                    <span className="text-sm text-gray-700">{customer.email}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Phone className="w-5 h-5 text-gray-400"/>
                                    <span className="text-sm text-gray-700">{formatPhoneNumber(customer.phone)}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Gift className="w-5 h-5 text-gray-400"/>
                                    <span className="text-sm text-gray-700">
                                        Born on: {customer.birthDate ? formatDate(customer.birthDate) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400"/>
                                    <span className="text-sm text-gray-700">
                                        Customer Since: {firstBookingDate ? formatDate(firstBookingDate) : 'No booking history'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                    <ClipboardList className="w-5 h-5 mr-2" /> Notes
                                </h3>
                                {isEditingNotes ? (
                                    <div className="flex gap-2">
                                        <button onClick={handleCancelNotes} className="text-sm text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
                                        <button onClick={handleSaveNotes} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Save</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditingNotes(true)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                )}
                            </div>
                            {isEditingNotes ? (
                                <textarea
                                    value={currentNotes}
                                    onChange={(e) => setCurrentNotes(e.target.value)}
                                    rows={6}
                                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Add notes for this customer..."
                                />
                            ) : (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap min-h-[6rem]">
                                    {customer.notes ? customer.notes : <p className="text-gray-400 italic">No notes added yet.</p>}
                                </div>
                            )}
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                <Package className="w-5 h-5 mr-2" /> Active Packages
                            </h3>
                            {activePackages.length > 0 ? (
                                <ul className="space-y-4">
                                    {activePackages.map(p => {
                                        const classType = getClassType(p.classTypeId);
                                        const packageName = `${p.totalSessions} Session - ${classType?.name || 'N/A'} (${p.trainerLevel})`;
                                        return (
                                            <li key={p.id} className="text-sm p-3 bg-gray-50 rounded-md">
                                                <p className="text-sm font-semibold text-gray-800">{packageName}</p>
                                                <p className="text-sm text-gray-600">Sessions Remaining: <span className="font-bold">{p.sessionsRemaining} / {p.totalSessions}</span></p>
                                                <p className="text-sm text-gray-500">Expires on: {formatDate(p.expirationDate)}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : <p className="text-sm text-gray-500">No active packages.</p>}
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <Card className="!p-0">
                            <h3 className="text-lg font-semibold text-gray-700 p-6">Upcoming Sessions</h3>
                            <div className="md:hidden divide-y divide-gray-200">
                                {paginatedUpcoming.map((booking: Booking) => {
                                    const trainer = getTrainer(booking.trainerId);
                                    const classType = getClassType(booking.classTypeId);
                                    return (
                                        <div key={booking.id} className="p-4">
                                            <p className="font-semibold">{formatDateTime(booking.dateTime)}</p>
                                            <p className="text-sm text-gray-600">{classType?.name || 'N/A'} with <Link to={`/manage/trainers/${trainer?.id}`} className="text-blue-600 hover:underline">{trainer?.firstName} {trainer?.lastName}</Link></p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-white border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedUpcoming.map((booking: Booking) => {
                                            const trainer = getTrainer(booking.trainerId);
                                            const classType = getClassType(booking.classTypeId);
                                            return (
                                                <tr key={booking.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDateTime(booking.dateTime)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classType?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {trainer ? (
                                                            <Link to={`/manage/trainers/${trainer.id}`} className="hover:text-blue-600">
                                                                {`${trainer.firstName} ${trainer.lastName}`}
                                                            </Link>
                                                        ) : 'N/A'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                             {paginatedUpcoming.length === 0 && (
                                <p className="px-6 py-4 text-center text-sm text-gray-500">No upcoming sessions.</p>
                            )}
                            <Pagination 
                                currentPage={upcomingCurrentPage}
                                totalPages={upcomingTotalPages}
                                onPageChange={setUpcomingCurrentPage}
                            />
                        </Card>
                        <Card className="!p-0">
                            <h3 className="text-lg font-semibold text-gray-700 p-6">Session History</h3>
                             <div className="md:hidden divide-y divide-gray-200">
                                {paginatedHistory.map((booking: Booking) => {
                                    const trainer = getTrainer(booking.trainerId);
                                    const classType = getClassType(booking.classTypeId);
                                    return (
                                        <div key={booking.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{formatDateTime(booking.dateTime)}</p>
                                                    <p className="text-sm text-gray-600">{classType?.name || 'N/A'} with <Link to={`/manage/trainers/${trainer?.id}`} className="text-blue-600 hover:underline">{trainer?.firstName} {trainer?.lastName}</Link></p>
                                                </div>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-white border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedHistory.map((booking: Booking) => {
                                            const trainer = getTrainer(booking.trainerId);
                                            const classType = getClassType(booking.classTypeId);
                                            return (
                                                <tr key={booking.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDateTime(booking.dateTime)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classType?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {trainer ? (
                                                            <Link to={`/manage/trainers/${trainer.id}`} className="hover:text-blue-600">
                                                                {`${trainer.firstName} ${trainer.lastName}`}
                                                            </Link>
                                                        ) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {paginatedHistory.length === 0 && (
                                <p className="px-6 py-4 text-center text-sm text-gray-500">No session history.</p>
                            )}
                            <Pagination 
                                currentPage={historyCurrentPage}
                                totalPages={historyTotalPages}
                                onPageChange={setHistoryCurrentPage}
                            />
                        </Card>
                    </div>
                </div>
            </div>
            <CustomerModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                customer={customer}
            />
        </>
    );
};

export default CustomerDetailPage;