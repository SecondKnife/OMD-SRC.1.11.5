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
import axios from 'axios';
import Qs from 'qs';
import { updateUserAccessToken } from './userAPI';

export type TableExportRequest = {
    q?: string;
    query_filter?: string;
    type: 'table' | 'column';
    column_filter?: string[];
};

const getAccessToken = async () => {
    const response = await updateUserAccessToken({
        JWTTokenExpiry: 'OneHour',
        tokenName: 'test',
    });

    const token = response?.jwtToken || '';

    return token;
};

const axiosClientCustom = axios.create({
    baseURL: `/custom-api`,
    paramsSerializer: (params) => Qs.stringify(params, { arrayFormat: 'comma' }),
});

axiosClientCustom.interceptors.request.use(async (config) => {
    const token = await getAccessToken();

    if (token) {
        // Use standard Bearer authorization header for custom API
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const exportTableData = async (data: TableExportRequest) => {
    const response = await axiosClientCustom.get(`/batch-export/export`, {
        params: data,
    });

    return response;
};

// --- Column Relation API ---

export interface ColumnRelation {
    id: string;
    source_table_fqn: string;
    source_column_name: string;
    target_table_fqn: string;
    target_column_name: string;
    created_by?: string;
    created_at?: string;
}

export const getColumnRelations = async (
    tableFqn: string
): Promise<ColumnRelation[]> => {
    const response = await axiosClientCustom.get('/column-relation', {
        params: { tableFqn },
    });

    return response.data?.data ?? [];
};

export const deleteColumnRelation = async (id: string) => {
    return axiosClientCustom.delete(`/column-relation/${id}`);
};
