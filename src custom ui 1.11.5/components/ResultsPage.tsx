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
import { useState, useEffect, useMemo, useCallback } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Empty, Pagination, Row, Select, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import type { Dayjs } from 'dayjs';
import api from '../utils/api';
import { usePaging } from '../hooks/usePaging';


const { RangePicker } = DatePicker;

type RangeValue = [Dayjs | null, Dayjs | null] | null;

enum SortType {
    ASC = 'asc',
    DESC = 'desc',
}

const ResultsPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { currentPage, pageSize, onPageChange, onShowSizeChange, setCurrentPage } = usePaging({
        persistenceKey: 'resultsPageSize',
    });

    const [total, setTotal] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ sortBy: string; sortType: string }>({ sortBy: '', sortType: '' });
    const [dataSearch, setDataSearch] = useState<any>({
        serviceName: [],
        databaseName: [],
        schemaName: [],
        tableName: [],
        columnName: [],
    });
    const [filter, setFilter] = useState<any>({
        serviceName: [],
        databaseName: [],
        schemaName: [],
        tableName: [],
        columnName: [],
        rangeDate: [] as (Dayjs | null)[],
    });
    const [isExporting, setIsExporting] = useState(false);
    const [isEmptyRule, setIsEmptyRule] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const rules = await api.getRulesTable({ currentPage: 1, pageSize: 10 });

                if ((rules.data?.data || []).length === 0) {
                    setIsEmptyRule(true);
                }
            } catch {
                // ignore
            }
        })();
    }, []);

    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await api.getResultsRule({
                currentPage,
                pageSize,

                serviceName: filter.serviceName,
                databaseName: filter.databaseName,
                schemaName: filter.schemaName,
                tableName: filter.tableName,
                columnName: filter.columnName,
                date:
                    filter?.rangeDate?.length === 2 && filter.rangeDate[0] && filter.rangeDate[1]
                        ? [
                            filter.rangeDate[0].format('YYYY-MM-DD'),
                            filter.rangeDate[1].format('YYYY-MM-DD'),
                        ]
                        : undefined,
                sortBy: sortConfig.sortBy || undefined,
                sortType: sortConfig.sortType || undefined,
            });
            setData(result.data?.data || []);
            setTotal(result.data?.paging?.total || 0);
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, filter, sortConfig]);

    const fetchGetDataSearch = async () => {
        try {
            const [serviceName, databaseName, schemaName, tableName, columnName] =
                await Promise.all([
                    api.getSearchData({ type: 'serviceName' }),
                    api.getSearchData({ type: 'databaseName' }),
                    api.getSearchData({ type: 'schemaName' }),
                    api.getSearchData({ type: 'tableName' }),
                    api.getSearchData({ type: 'columnName' }),
                ]);

            setDataSearch({
                serviceName: serviceName.data?.data || [],
                databaseName: databaseName.data?.data || [],
                schemaName: schemaName.data?.data || [],
                tableName: tableName.data?.data || [],
                columnName: columnName.data?.data || [],
            });
        } catch (error) {
            console.error('Failed to fetch search data:', error);
        }
    };

    useEffect(() => {
        fetchResults();
        fetchGetDataSearch();
    }, []);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const renderText = (text: string) => {
        return text ? <span>{text}</span> : <span style={{ color: '#9ca3af' }}>[null]</span>;
    };

    const columns = useMemo((): ColumnsType<any> => {
        return [
            { key: 'date', title: 'Date', dataIndex: 'date', render: renderText, sorter: true },
            { key: 'serviceName', title: 'Service Name', dataIndex: 'serviceName', render: renderText, sorter: true },
            { key: 'databaseName', title: 'Database Name', dataIndex: 'databaseName', render: renderText, sorter: true },
            { key: 'schemaName', title: 'Schema Name', dataIndex: 'schemaName', render: renderText, sorter: true },
            { key: 'tableName', title: 'Table Name', dataIndex: 'tableName', render: renderText, sorter: true },
            { key: 'columnName', title: 'Column Name', dataIndex: 'columnName', render: renderText, sorter: true },
            { key: 'term', title: 'Term', dataIndex: 'term', render: renderText, sorter: true },
            { key: 'completenessAmount', title: 'Completeness Amount', dataIndex: 'completenessAmount', render: renderText, sorter: true },
            { key: 'validityAmount', title: 'Validity Amount', dataIndex: 'validityAmount', render: renderText, sorter: true },
            { key: 'accuracyAmount', title: 'Accuracy Amount', dataIndex: 'accuracyAmount', render: renderText, sorter: true },
            { key: 'uniquenessAmount', title: 'Uniqueness Amount', dataIndex: 'uniquenessAmount', render: renderText, sorter: true },
            { key: 'consistencyAmount', title: 'Consistency Amount', dataIndex: 'consistencyAmount', render: renderText, sorter: true },
            { key: 'sampleSizeAmount', title: 'Sample Size Amount', dataIndex: 'sampleSizeAmount', render: renderText, sorter: true },
            { key: 'role', title: 'Role', dataIndex: 'role', render: renderText, sorter: true },
            { key: 'ownerRole', title: 'Owner Role', dataIndex: 'ownerRole', render: renderText, sorter: true },
        ];
    }, []);

    const handleTableChange = (_pagination: any, _filters: any, sorter: SorterResult<any> | SorterResult<any>[]) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s.order) {
            setSortConfig({
                sortBy: String(s.columnKey || ''),
                sortType: s.order === 'ascend' ? SortType.ASC : SortType.DESC,
            });
        } else {
            setSortConfig({ sortBy: '', sortType: '' });
        }
        setCurrentPage(1);
    };

    const onChangeSelect = (value: any, key: string) => {
        setFilter({ ...filter, [key]: value });
        setCurrentPage(1);
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await api.exportDataQualityResults({
                serviceName: filter.serviceName,
                databaseName: filter.databaseName,
                schemaName: filter.schemaName,
                tableName: filter.tableName,
                columnName: filter.columnName,
                date:
                    filter?.rangeDate?.length === 2 && filter.rangeDate[0] && filter.rangeDate[1]
                        ? [
                            filter.rangeDate[0].format('YYYY-MM-DD'),
                            filter.rangeDate[1].format('YYYY-MM-DD'),
                        ]
                        : undefined,
            });
            if (response.data?.data) {
                window.open(response.data.data, '_blank');
            }
        } catch (error) {
            message.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const emptyText = isEmptyRule
        ? "Start adding Data Quality Rules in tab 'By Rules'"
        : !isEmptyRule && data.length === 0
            ? 'No Results'
            : '';

    return (
        <Row gutter={[16, 16]} style={{ padding: '16px 24px' }}>
            <Col span={24} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Select
                        allowClear
                        options={dataSearch.serviceName.map((item: string) => ({
                            label: item,
                            value: item,
                        }))}
                        placeholder="Service Name"
                        style={{ width: 200 }}
                        value={filter.serviceName}
                        onChange={(v) => onChangeSelect(v, 'serviceName')}
                    />
                    <Select
                        allowClear
                        options={dataSearch.databaseName.map((item: string) => ({
                            label: item,
                            value: item,
                        }))}
                        placeholder="Database Name"
                        style={{ width: 200 }}
                        value={filter.databaseName}
                        onChange={(v) => onChangeSelect(v, 'databaseName')}
                    />
                    <Select
                        allowClear
                        options={dataSearch.schemaName.map((item: string) => ({
                            label: item,
                            value: item,
                        }))}
                        placeholder="Schema Name"
                        style={{ width: 200 }}
                        value={filter.schemaName}
                        onChange={(v) => onChangeSelect(v, 'schemaName')}
                    />
                    <Select
                        allowClear
                        maxTagCount="responsive"
                        mode="multiple"
                        options={dataSearch.tableName.map((item: string) => ({
                            label: item,
                            value: item,
                        }))}
                        placeholder="Table Name"
                        style={{ width: 200 }}
                        value={filter.tableName}
                        onChange={(v) => onChangeSelect(v, 'tableName')}
                    />
                    <Select
                        allowClear
                        maxTagCount="responsive"
                        mode="multiple"
                        options={dataSearch.columnName.map((item: string) => ({
                            label: item,
                            value: item,
                        }))}
                        placeholder="Column Name"
                        style={{ width: 200 }}
                        value={filter.columnName}
                        onChange={(v) => onChangeSelect(v, 'columnName')}
                    />
                    <RangePicker
                        placeholder={['From', 'To']}
                        value={filter.rangeDate?.length === 2 ? filter.rangeDate : null}
                        onChange={(v) => onChangeSelect(v || [], 'rangeDate')}
                    />
                </div>
                <div>
                    <Button
                        disabled={isExporting}
                        icon={<UploadOutlined />}
                        loading={isExporting}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
                </div>
            </Col>

            <Col span={24}>
                <Table
                    bordered
                    columns={columns}
                    dataSource={data}
                    loading={isLoading}
                    locale={{
                        emptyText: <Empty description={emptyText || 'No Data'} />,
                    }}
                    pagination={false}
                    scroll={{ x: 'max-content', y: '60vh' }}
                    size="small"
                    onChange={handleTableChange}
                />
            </Col>
            <Col span={24}>
                <Pagination
                    showSizeChanger
                    style={{ textAlign: 'center', marginBottom: 16 }}
                    current={currentPage}
                    pageSize={pageSize}
                    pageSizeOptions={[20, 50, 100]}
                    showTotal={(t) => `Total records: ${t}`}
                    total={total}
                    onChange={onPageChange}
                    onShowSizeChange={onShowSizeChange}
                />
            </Col>

        </Row>
    );
};

export default ResultsPage;
