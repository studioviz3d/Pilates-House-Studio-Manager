
import React, { useState, useMemo } from 'react';
import { useStudioData } from '../hooks/useStudioData';
import Card from '../components/ui/Card';
import PackageModal from '../components/PackageModal';
import { Plus, Search, PackageX } from 'lucide-react';
import { Package } from '../types';
import { differenceInDays } from 'date-fns/differenceInDays';
import { isBefore } from 'date-fns/isBefore';
import Select, { SelectOption } from '../components/ui/Select';
import PackageCard from '../components/packages/PackageCard';

type PackageWithCustomer = Package & { customerId: string; customerName: string };

const PackagesPage: React.FC = () => {
    const { customers } = useStudioData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PackageWithCustomer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all-active' | 'running-low' | 'expiring-soon' | 'completed' | 'expired' | 'archived'>('all-active');
    const [sort, setSort] = useState<'purchase-desc' | 'purchase-asc' | 'expire-asc' | 'expire-desc' | 'sessions-asc' | 'sessions-desc'>('purchase-desc');

    const allPackages = useMemo<PackageWithCustomer[]>(() => {
        return customers.flatMap(customer =>
            customer.packages.map(pkg => ({
                ...pkg,
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`
            }))
        );
    }, [customers]);

    const getPackageStatusText = (pkg: Package) => {
        const now = new Date();
        const expiration = new Date(pkg.expirationDate);

        if (pkg.isArchived) return 'Archived';
        if (isBefore(expiration, now)) return 'Expired';
        if (pkg.sessionsRemaining === 0) return 'Completed';
        if (differenceInDays(expiration, now) <= 7) return 'Expiring Soon';
        if (pkg.sessionsRemaining <= 3) return 'Running Low';
        return 'Active';
    };

    const filteredAndSortedPackages = useMemo(() => {
        let packages = allPackages.filter(pkg => {
            const status = getPackageStatusText(pkg);
            const searchMatch = pkg.customerName.toLowerCase().includes(searchTerm.toLowerCase());
            if (!searchMatch) return false;

            switch (filter) {
                case 'all-active': return !pkg.isArchived && status !== 'Expired' && status !== 'Completed';
                case 'running-low': return status === 'Running Low';
                case 'expiring-soon': return status === 'Expiring Soon';
                case 'completed': return status === 'Completed';
                case 'expired': return status === 'Expired';
                case 'archived': return status === 'Archived';
                default: return true;
            }
        });

        return packages.sort((a, b) => {
            switch (sort) {
                case 'purchase-desc': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
                case 'purchase-asc': return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
                case 'expire-asc': return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
                case 'expire-desc': return new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime();
                case 'sessions-asc': return a.sessionsRemaining - b.sessionsRemaining;
                case 'sessions-desc': return b.sessionsRemaining - a.sessionsRemaining;
                default: return 0;
            }
        });
    }, [allPackages, searchTerm, filter, sort]);


    const handleAddPackage = () => {
        setSelectedPackage(null);
        setIsModalOpen(true);
    };

    const handleEditPackage = (pkg: PackageWithCustomer) => {
        setSelectedPackage(pkg);
        setIsModalOpen(true);
    };

    const filterOptions: SelectOption[] = [
        { value: 'all-active', label: 'All Active' },
        { value: 'running-low', label: 'Running Low' },
        { value: 'expiring-soon', label: 'Expiring Soon' },
        { value: 'completed', label: 'Completed' },
        { value: 'expired', label: 'Expired' },
        { value: 'archived', label: 'Archived' },
    ];
    
    const sortOptions: SelectOption[] = [
        { value: 'purchase-desc', label: 'Newest Purchase' },
        { value: 'purchase-asc', label: 'Oldest Purchase' },
        { value: 'expire-asc', label: 'Expires Soonest' },
        { value: 'expire-desc', label: 'Expires Latest' },
        { value: 'sessions-asc', label: 'Sessions Left (Low-High)' },
        { value: 'sessions-desc', label: 'Sessions Left (High-Low)' },
    ];

    return (
        <>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">Packages</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="w-full sm:w-48">
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
                                placeholder="Search by customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleAddPackage}
                            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                            <Plus size={16} className="mr-2" />
                            Add Package
                        </button>
                    </div>
                </div>

                {filteredAndSortedPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAndSortedPackages.map(pkg => (
                            <PackageCard key={pkg.id} pkg={pkg} onEdit={handleEditPackage} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <div className="text-center py-12">
                            <PackageX className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No packages found</h3>
                            <p className="mt-1 text-sm text-gray-500">No packages match the current filters.</p>
                        </div>
                    </Card>
                )}
            </div>
            <PackageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                pkg={selectedPackage}
            />
        </>
    );
};

export default PackagesPage;