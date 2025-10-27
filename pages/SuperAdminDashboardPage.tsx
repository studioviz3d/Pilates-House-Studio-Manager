import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { LogOut, ShieldCheck, Plus, Building, MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Studio } from '../types';
import { formatDate } from '../utils';
import CreateStudioModal from '../components/CreateStudioModal';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const StudioActions: React.FC<{ studio: Studio; onArchive: () => void; onUnarchive: () => void; onDelete: () => void; }> = ({ studio, onArchive, onUnarchive, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md">
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                    {studio.isArchived ? (
                        <button onClick={() => { onUnarchive(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <ArchiveRestore size={14} className="mr-2" /> Unarchive
                        </button>
                    ) : (
                        <button onClick={() => { onArchive(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <Archive size={14} className="mr-2" /> Archive
                        </button>
                    )}
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <Trash2 size={14} className="mr-2" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

const SuperAdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allStudios, setAllStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
    const [confirmAction, setConfirmAction] = useState<{ action: 'archive' | 'unarchive' | 'delete', studio: Studio } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "studios"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const studiosData: Studio[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                studiosData.push({
                    id: doc.id,
                    name: data.name,
                    adminEmail: data.adminEmail,
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                    isArchived: data.isArchived || false,
                });
            });
            setAllStudios(studiosData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching studios: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredStudios = useMemo(() => {
        if (filter === 'all') return allStudios;
        if (filter === 'archived') return allStudios.filter(s => s.isArchived);
        return allStudios.filter(s => !s.isArchived);
    }, [allStudios, filter]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/super-admin/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };
    
    const handleConfirmAction = async () => {
        if (!confirmAction) return;

        setActionLoading(true);
        try {
            const functions = getFunctions(getApp());
            const manageStudio = httpsCallable(functions, 'manageStudio');
            await manageStudio({ studioId: confirmAction.studio.id, action: confirmAction.action });
        } catch (error) {
            console.error("Error managing studio:", error);
            alert(`Failed to ${confirmAction.action} studio. See console for details.`);
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-slate-100">
                <header className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <ShieldCheck className="w-8 h-8 text-blue-600" />
                                <h1 className="ml-3 text-xl font-bold text-slate-800">Super Admin Dashboard</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-600 hidden sm:block">{user?.email}</span>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                <main>
                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <div className="px-4 sm:px-0">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                                <h2 className="text-2xl font-semibold text-gray-700">Managed Studios</h2>
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-200 rounded-lg p-1 flex items-center">
                                        {(['active', 'archived', 'all'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${filter === f ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                            >{f}</button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        Create Studio
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                                {loading ? (
                                    <div className="p-16 flex justify-center items-center"><Spinner /></div>
                                ) : filteredStudios.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Studio Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Email</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Created</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredStudios.map((studio) => (
                                                    <tr key={studio.id} className={studio.isArchived ? 'bg-gray-50' : ''}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{studio.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studio.adminEmail}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(studio.createdAt)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            {studio.isArchived ? (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Archived</span>
                                                            ) : (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <StudioActions 
                                                                studio={studio}
                                                                onArchive={() => setConfirmAction({ action: 'archive', studio })}
                                                                onUnarchive={() => setConfirmAction({ action: 'unarchive', studio })}
                                                                onDelete={() => setConfirmAction({ action: 'delete', studio })}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center p-12">
                                        <Building className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No studios found</h3>
                                        <p className="mt-1 text-sm text-gray-500">No studios match the current filter.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <CreateStudioModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmAction}
                title={`${confirmAction?.action.charAt(0).toUpperCase() + confirmAction?.action.slice(1)} Studio`}
                confirmText={actionLoading ? 'Processing...' : (confirmAction?.action.charAt(0).toUpperCase() + confirmAction?.action.slice(1))}
                isDelete={confirmAction?.action === 'delete'}
            >
                {confirmAction?.action === 'delete' ? (
                    `Are you sure you want to permanently delete "${confirmAction.studio.name}"? This will delete all associated data (customers, bookings, etc.) and cannot be undone.`
                ) : (
                    `Are you sure you want to ${confirmAction?.action} the studio "${confirmAction?.studio.name}"?`
                )}
            </ConfirmationModal>
        </>
    );
};

export default SuperAdminDashboardPage;
