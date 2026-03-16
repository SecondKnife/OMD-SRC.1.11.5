import axios, { AxiosInstance } from 'axios';

// Runtime config injected by entrypoint.sh at container startup (from env vars / ConfigMap)
declare global {
    interface Window {
        __CONFIG__: {
            CUSTOM_API_URL: string;
            API_URL: string;
        };
    }
}

class ApiClient {
    private client: AxiosInstance; // For Custom Service Backend
    private omClient: AxiosInstance; // For OpenMetadata Backend

    constructor() {
        const config: Window['__CONFIG__'] = window.__CONFIG__ || { CUSTOM_API_URL: '', API_URL: '' };

        this.client = axios.create({
            baseURL: config.CUSTOM_API_URL || '/custom-api',
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.omClient = axios.create({
            baseURL: config.API_URL || '/api/v1',
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.setupInterceptors(this.client);
        this.setupInterceptors(this.omClient);
    }


    private securityToken: string = '';
    private securityTokenPromise: Promise<void> | null = null;

    private async getBearerFromIndexedDB(): Promise<string | null> {
        return new Promise((resolve) => {
            try {
                const dbRequest = indexedDB.open('AppDataStore');
                dbRequest.onerror = () => resolve(null);
                dbRequest.onsuccess = () => {
                    const db = dbRequest.result;
                    if (!db.objectStoreNames.contains('keyValueStore')) {
                        return resolve(null);
                    }
                    const tx = db.transaction('keyValueStore', 'readonly');
                    const store = tx.objectStore('keyValueStore');
                    const getReq = store.get('app_state');
                    getReq.onsuccess = () => {
                        const raw = getReq.result;
                        if (raw) {
                            try {
                                const parsed = JSON.parse(raw);
                                resolve(parsed.primary || null);
                            } catch {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    };
                    getReq.onerror = () => resolve(null);
                };
            } catch {
                resolve(null);
            }
        });
    }

    private async getBearerToken(): Promise<string | null> {
        // Priority 1: IndexedDB (AppDataStore -> keyValueStore -> app_state.primary)
        const fromIdx = await this.getBearerFromIndexedDB();
        if (fromIdx) return fromIdx;

        // Priority 2: localStorage om-session (oidcIdToken)
        const omSession = localStorage.getItem('om-session');
        if (omSession) {
            try {
                const parsed = JSON.parse(omSession);
                if (parsed?.state?.oidcIdToken) return parsed.state.oidcIdToken;
            } catch { }
        }

        // Priority 3: generic token storage
        const token = localStorage.getItem('token');
        if (token) return token;

        // Priority 4: cookie
        return this.getTokenFromCookie();
    }

    private fetchSecurityToken(): Promise<void> {
        if (this.securityTokenPromise) return this.securityTokenPromise;

        this.securityTokenPromise = (async () => {
            const bearer = await this.getBearerToken();
            if (!bearer) return;
            try {
                // Call OMD directly to avoid intercepts that check securityToken
                const response = await axios.put(`${window.__CONFIG__?.API_URL || '/api/v1'}/users/security/token`, null, {
                    headers: {
                        Authorization: `Bearer ${bearer}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
                const data = response.data;
                if (data?.jwtToken || data?.token) {
                    this.securityToken = data.jwtToken || data.token;
                }
            } catch (e) {
                console.error('Failed to fetch security token', e);
            } finally {
                this.securityTokenPromise = null;
            }
        })();

        return this.securityTokenPromise;
    }

    private setupInterceptors(client: AxiosInstance) {
        client.interceptors.request.use(
            async (config) => {
                // If this is the security token call itself, skip the regular intercept logic
                if (config.url?.includes('/users/security/token')) {
                    return config;
                }

                // If we don't have a security token yet, try to fetch it
                if (!this.securityToken) {
                    await this.fetchSecurityToken();
                }

                const bearer = await this.getBearerToken();
                if (bearer) {
                    config.headers.Authorization = `Bearer ${bearer}`;
                }

                // Attach security token to headers if available
                if (this.securityToken) {
                    config.headers.omToken = this.securityToken;
                    config.headers.omtoken = this.securityToken;
                } else if (bearer) {
                    // Fallback to bearer if security fetch failed
                    config.headers.omToken = bearer;
                    config.headers.omtoken = bearer;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Possible token expiration handling here
                }
                return Promise.reject(error);
            }
        );
    }

    private getTokenFromCookie(): string | null {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'openmetadata_token' || name === 'token') {
                return value;
            }
        }
        return null;
    }

    // --- Upload Methods (Custom Backend) ---
    async uploadDictionary(files: FileList, requestId?: string) {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });
        if (requestId) formData.append('request_id', requestId);
        return this.client.post('/upload/dictionary', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async uploadGlossary(files: FileList, requestId?: string) {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });
        if (requestId) formData.append('request_id', requestId);
        return this.client.post('/upload/glossary', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async getUploadStatus(requestId: string) {
        return this.client.get(`/upload/status/${requestId}`);
    }

    // --- Report Methods (Custom Backend) ---

    // Report 2: Lineage Changes
    async getLineageChanges(start?: string, end?: string) {
        return this.client.get('/report/lineage-changes', {
            params: { start_date: start, end_date: end }
        });
    }
    async exportLineageChanges(start?: string, end?: string) {
        return this.client.get('/report/lineage-changes/export', {
            params: { start_date: start, end_date: end },
            responseType: 'blob'
        });
    }

    // Report 3: Table Relationships
    async getTableRelationships(table?: string[], column?: string[]) {
        return this.client.get('/report/table-relationships', {
            params: { table, column } // Axios serializes arrays correctly
        });
    }
    async exportTableRelationships(table?: string[], column?: string[]) {
        return this.client.get('/report/table-relationships/export', {
            params: { table, column },
            responseType: 'blob'
        });
    }

    // Report 1: Column Changes (using correct name based on Report1.tsx)
    async getTableColumnUpdate(database?: string, schema?: string[], start?: string, end?: string) {
        return this.client.get('/report/column-changes', {
            params: { database, schema, start_date: start, end_date: end }
        });
    }
    async exportTableColumnUpdate(database?: string, schema?: string[], start?: string, end?: string) {
        return this.client.get('/report/column-changes/export', {
            params: { database, schema, start_date: start, end_date: end },
            responseType: 'blob'
        });
    }

    // --- OpenMetadata API Methods (OM Backend) ---

    async getDatabases(service?: string, fields?: string, params?: { limit: number }) {
        return this.omClient.get('/databases', { params });
    }

    async getDatabaseSchemas(params: { databaseName: string; limit: number }) {
        // param lookup might need adjustment based on real API
        return this.omClient.get(`/databases/name/${params.databaseName}/schemas`, {
            params: { limit: params.limit }
        });
        // Note: The original Report1 calls `getDatabaseSchemas` with params. 
        // I'm assuming standard OM API structure here or close to it.
    }

    // For Report 3 Filters
    async getReportLayer() {
        // This seems to be a custom metadata endpoint or configuration.
        // If it was in customAPI originally, it might be on Custom Backend.
        // Check if report.router has it. Assuming it's a custom endpoint for now.
        return this.client.get('/report/layers');
    }

    async getListTableByLayer(layer: string, search?: string) {
        return this.client.get('/report/tables-by-layer', {
            params: { layer, search }
        });
    }

    // --- Data Quality Methods (Custom Backend) ---

    async getRulesTable(params?: { currentPage: number; pageSize: number }) {
        return this.client.get('/data-quality/rules', { params });
    }


    async generateUploadPresignedUrl(fileName: string) {
        return this.client.post('/data-quality/generate-upload-presigned-url', { fileName });
    }

    async checkFileValidation(fileName: string) {
        return this.client.post('/data-quality/validate-upload-rules', { fileName });
    }

    async getResultsRule(params?: any) {
        return this.client.get('/data-quality/check-results', { params });
    }

    async getSearchData(params?: { type: string }) {
        return this.client.get('/data-quality/check-results/search-data', { params });
    }

    async exportDataQualityResults(params?: any) {
        return this.client.get('/data-quality/check-results/export', { params });
    }

    // --- OMD Test Suite APIs (for By Tables) ---

    async getTestCaseExecutionSummary() {
        return this.omClient.get('/dataQuality/testSuites/executionSummary');
    }

    async getTestSuitesBySearch(params?: {
        fields?: string;
        q?: string;
        owner?: string;
        currentPage?: number;
        pageSize?: number;
        includeEmptyTestSuites?: boolean;
        testSuiteType?: string;
        sortField?: string;
        sortType?: string;
        sortNestedPath?: string;
        sortNestedMode?: string[];
    }) {
        return this.omClient.get('/dataQuality/testSuites/search/list', { params });
    }

}


export default new ApiClient();
