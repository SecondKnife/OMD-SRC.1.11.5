/*
*  Copyright 2024 Collate.
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*  http://www.apache.org/licenses/LICENSE-2.0
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PagingConfig {
    defaultPageSize?: number;
    persistenceKey?: string;
}

export const usePaging = (config: PagingConfig = {}) => {
    const { defaultPageSize = 20, persistenceKey = 'pageSize' } = config;
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize pageSize from localStorage or URL or default
    const getInitialPageSize = () => {
        const urlSize = searchParams.get('pageSize');
        if (urlSize) return parseInt(urlSize, 10);

        const storedSize = localStorage.getItem(persistenceKey);
        if (storedSize) return parseInt(storedSize, 10);

        return defaultPageSize;
    };

    // Initialize currentPage from URL or default
    const getInitialPage = () => {
        const urlPage = searchParams.get('page');
        if (urlPage) return parseInt(urlPage, 10);
        return 1;
    };

    const [currentPage, setCurrentPage] = useState<number>(getInitialPage());
    const [pageSize, setPageSize] = useState<number>(getInitialPageSize());

    // Update URL when currentPage or pageSize changes, only if values are different
    useEffect(() => {
        const urlPage = searchParams.get('currentPage');
        const urlPageSize = searchParams.get('pageSize');

        if (urlPage !== currentPage.toString() || urlPageSize !== pageSize.toString()) {
            const params = new URLSearchParams(searchParams);
            params.set('currentPage', currentPage.toString());
            params.set('pageSize', pageSize.toString());
            setSearchParams(params, { replace: true });
        }
    }, [currentPage, pageSize, setSearchParams, searchParams]);



    // Handle page change
    const onPageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // Handle pageSize change
    const onShowSizeChange = useCallback((_current: number, size: number) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page on size change
        localStorage.setItem(persistenceKey, size.toString());
    }, [persistenceKey]);

    return {
        currentPage,
        pageSize,
        onPageChange,
        onShowSizeChange,
        setCurrentPage,
        setPageSize,
    };
};
