

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../components/ui/Card';
import TrainerModal from '../components/TrainerModal';
import { Link } from 'react-router-dom';
import { Plus, Search, FilePenLine, Calendar, MoreVertical, Mail, Phone } from 'lucide-react';
import { Trainer, TrainerLevel } from '../types';
import { formatPhoneNumber } from '../../utils';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import Select, { SelectOption } from '../components/ui/Select';

const RowActions: React.FC<{ trainer: Trainer; onEdit: (t: Trainer) => void; }> = ({ trainer, onEdit }) => {
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

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md">
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                    <button onClick={() => { onEdit(trainer); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <FilePenLine size={14} className="mr-2" /> Edit
                    </button>
                     <Link to={`/manage/trainers/${trainer.id}/schedule`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Calendar size={14} className="mr-2" /> View Schedule
                    </Link>
                 </div>
            )}
        </div>
    );
};


const TrainersPage: React.FC = () => {
    const { trainers } = useStudioData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter and Sort states
    const [filter, setFilter] = useState<'all' | 'Regular' | 'Master'>('all');
    const [sort, setSort] = useState<'name-asc' | 'name-desc'>('name-asc');
    
    const filterOptions: SelectOption[] = [
        { value: 'all', label: 'All Levels' },
        { value: 'Regular', label: 'Regular' },
        { value: 'Master', label: 'Master' },
    ];
    
    const sortOptions: SelectOption[] = [
        { value: 'name-asc', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' },
    ];

    const filteredAndSortedTrainers = useMemo(() => {
        let filtered = trainers.filter(trainer => {
            const searchMatch = searchTerm === '' ||
                `${trainer.firstName} ${trainer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase());
            
            const filterMatch = filter === 'all' || trainer.level === filter;
            
            return searchMatch && filterMatch;
        });
        
        return filtered.sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            if (sort === 'name-asc') {
                return nameA.localeCompare(nameB);
            } else { // name-desc
                return nameB.localeCompare(nameA);
            }
        });

    }, [trainers, searchTerm, filter, sort]);
    
    const {
        currentPageData: paginatedTrainers,
        currentPage,
        totalPages,
        setCurrentPage,
        itemsPerPage,
        totalItems,
    } = usePagination(filteredAndSortedTrainers, 10);


    const handleAddTrainer = () => {
        setSelectedTrainer(null);
        setIsModalOpen(true);
    };

    const handleEditTrainer = (trainer: Trainer) => {
        setSelectedTrainer(trainer);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">Trainers</h2>
                     <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <Select
                                options={filterOptions}
                                value={filter}
                                onChange={(val) => setFilter(val as any)}
                                labelPrefix="Filter by:"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                options={sortOptions}
                                value={sort}
                                onChange={(val) => setSort(val as any)}
                                labelPrefix="Sort by:"
                            />
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search name or specialty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleAddTrainer}
                            className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                            <Plus size={16} className="mr-2" />
                            Add Trainer
                        </button>
                    </div>
                </div>

                <Card className="!p-0">
                    {/* Mobile View: List of Cards */}
                    <div className="md:hidden">
                        <div className="divide-y divide-gray-200">
                            {/* FIX: Add explicit type to resolve type inference issue. */}
                            {paginatedTrainers.map((trainer: Trainer) => (
                                <div key={trainer.id} className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <Link to={`/manage/trainers/${trainer.id}`} className="flex items-center group">
                                            <img className="h-10 w-10 rounded-full object-cover" src={trainer.avatarUrl} alt="" />
                                            <div className="ml-3">
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{`${trainer.firstName} ${trainer.lastName}`}</p>
                                                <p className="text-xs text-gray-500">{trainer.specialization}</p>
                                            </div>
                                        </Link>
                                        <RowActions trainer={trainer} onEdit={handleEditTrainer} />
                                    </div>
                                    <div className="pl-13 space-y-1 text-sm">
                                        <div className="flex items-center text-gray-600 gap-2">
                                            <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{trainer.email}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600 gap-2">
                                            <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                            <span>{formatPhoneNumber(trainer.phone)}</span>
                                        </div>
                                        <div className="pt-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trainer.level === 'Master' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {trainer.level}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {/* FIX: Add explicit type to resolve type inference issue. */}
                                {paginatedTrainers.map((trainer: Trainer) => (
                                    <tr key={trainer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/manage/trainers/${trainer.id}`} className="flex items-center group">
                                                <img className="h-10 w-10 rounded-full object-cover" src={trainer.avatarUrl} alt="" />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{`${trainer.firstName} ${trainer.lastName}`}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{trainer.email}</div>
                                            <div>{formatPhoneNumber(trainer.phone)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trainer.specialization}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trainer.level === 'Master' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {trainer.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/manage/trainers/${trainer.id}/schedule`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md" title="View Schedule">
                                                    <Calendar size={16} />
                                                </Link>
                                                <RowActions
                                                    trainer={trainer}
                                                    onEdit={handleEditTrainer}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                    />
                </Card>
            </div>
            <TrainerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                trainer={selectedTrainer}
            />
        </>
    );
};

export default TrainersPage;