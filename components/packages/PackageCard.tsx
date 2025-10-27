import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from '../../types';
import { useStudioData } from '../../hooks/useStudioData';
import { formatDate } from '../../utils';
import { FilePenLine, Archive, ArchiveRestore, MoreVertical } from 'lucide-react';
import Card from '../ui/Card';
import { differenceInDays, isBefore } from 'date-fns';

type PackageWithCustomer = Package & { customerId: string; customerName: string };

interface PackageCardProps {
    pkg: PackageWithCustomer;
    onEdit: (pkg: PackageWithCustomer) => void;
}

const statusInfo: Record<string, { badge: string }> = {
    'gray': { badge: 'bg-gray-100 text-gray-800' },
    'red': { badge: 'bg-red-100 text-red-800' },
    'green': { badge: 'bg-green-100 text-green-800' },
    'yellow': { badge: 'bg-yellow-100 text-yellow-800' },
    'orange': { badge: 'bg-orange-100 text-orange-800' },
    'blue': { badge: 'bg-blue-100 text-blue-800' },
};

const progressColors = {
    'red': 'bg-red-500',
    'orange': 'bg-orange-500',
    'green': 'bg-green-500',
};

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit }) => {
    const { getClassType, getCustomer, togglePackageArchiveStatus, now } = useStudioData();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const classType = getClassType(pkg.classTypeId);
    const customer = getCustomer(pkg.customerId);
    
    const getPackageStatus = (p: Package) => {
        const expiration = new Date(p.expirationDate);

        if (p.isArchived) return { text: 'Archived', color: 'gray' };
        if (isBefore(expiration, now)) return { text: 'Expired', color: 'red' };
        if (p.sessionsRemaining === 0) return { text: 'Completed', color: 'green' };
        
        const daysUntilExpiry = differenceInDays(expiration, now);
        if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) return { text: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`, color: 'yellow' };
        if (p.sessionsRemaining > 0 && p.sessionsRemaining <= 3) return { text: 'Running Low', color: 'orange' };
        
        return { text: 'Active', color: 'blue' };
    };
    
    const status = getPackageStatus(pkg);
    
    const progressPercentage = pkg.totalSessions > 0 ? (pkg.sessionsRemaining / pkg.totalSessions) * 100 : 0;

    let progressBarColor = progressColors.green;
    if (progressPercentage <= 25) progressBarColor = progressColors.red;
    else if (progressPercentage <= 50) progressBarColor = progressColors.orange;

    return (
        <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <Link to={`/customers/${pkg.customerId}`} className="flex items-center group mb-2">
                            <img className="h-10 w-10 rounded-full object-cover" src={customer?.avatarUrl} alt="" />
                            <div className="ml-3">
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{pkg.customerName}</div>
                            </div>
                        </Link>
                         <p className="text-md font-semibold text-gray-800">
                            {pkg.totalSessions}x {classType?.name} <span className="text-gray-500">({pkg.trainerLevel})</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 -mr-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo[status.color].badge}`}>{status.text}</span>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200">
                                <MoreVertical size={16} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                                    <button 
                                        onClick={() => { onEdit(pkg); setIsMenuOpen(false); }} 
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        <FilePenLine size={14} className="mr-2" /> Edit
                                    </button>
                                    <button 
                                        onClick={() => { togglePackageArchiveStatus(pkg.customerId, pkg.id); setIsMenuOpen(false); }} 
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        {pkg.isArchived ? <ArchiveRestore size={14} className="mr-2" /> : <Archive size={14} className="mr-2" />}
                                        {pkg.isArchived ? "Unarchive" : "Archive"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                        <span>Sessions Remaining</span>
                        <span>{pkg.sessionsRemaining} / {pkg.totalSessions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${progressBarColor}`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
                
                <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>Purchased: {formatDate(pkg.purchaseDate)}</span>
                    <span>Expires: {formatDate(pkg.expirationDate)}</span>
                </div>
            </div>
        </Card>
    );
}

export default PackageCard;