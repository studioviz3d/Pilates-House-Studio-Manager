import { useState, useMemo, useEffect } from 'react';

interface PaginationResult<T> {
    currentPageData: T[];
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
    setItemsPerPage: (count: number) => void;
    totalItems: number;
}

export const usePagination = <T,>(
    data: T[],
    initialItemsPerPage: number = 10
): PaginationResult<T> => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    const totalPages = useMemo(() => {
        if (data.length === 0) return 1;
        return Math.ceil(data.length / itemsPerPage);
    }, [data.length, itemsPerPage]);

    const currentPageData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

    const handleSetCurrentPage = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        } else if (totalPages > 0 && page > totalPages) {
            setCurrentPage(totalPages);
        } else if (page < 1) {
            setCurrentPage(1);
        }
    };
    
    useEffect(() => {
        if (currentPage > totalPages) {
          setCurrentPage(totalPages);
        }
    }, [data, itemsPerPage, currentPage, totalPages]);


    return {
        currentPageData,
        currentPage,
        totalPages,
        setCurrentPage: handleSetCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalItems: data.length
    };
};
