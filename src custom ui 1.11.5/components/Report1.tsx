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
import { useState, useEffect, useMemo } from 'react';
import { FileSearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, Row, Select, Typography, DatePicker, Table, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import api from '../utils/api';

const { RangePicker } = DatePicker;

type RangeValue = [Dayjs | null, Dayjs | null] | null;

function Report1() {
    const [data, setData] = useState<any>([]);
    const [dataSearch, setDataSearch] = useState<any>({
        databaseName: [],
        schemaName: [],
    });
    const [filter, setFilter] = useState<any>({
        databaseName: null,
        schemaName: [],
        dateRange: [] as (Dayjs | null)[],
    });
    const [isCheckReport, setIsCheckReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [savedStateFilter, setSavedStateFilter] = useState<any>({
        databaseName: null,
        schemaName: null,
    });

    const onChangeSelect = (value: string[] | any, key: string) => {
        setFilter({ ...filter, [key]: value });
    };

    const fetchGetDataSearch = async () => {
        try {
            const databaseName = await api.getDatabases(undefined, undefined, {
                limit: 1000,
            });

            setDataSearch({
                databaseName: databaseName?.data?.data?.map((item: any) => ({
                    value: item.fullyQualifiedName,
                    label: item.name,
                })),
                schemaName: [],
            });
        } catch (error) {
            message.error('Failed to fetch databases');
        }
    };

    useEffect(() => {
        (async () => {
            setFilter({
                ...filter,
                schemaName: [],
            });

            if (!filter.databaseName) {
                setDataSearch({
                    ...dataSearch,
                    schemaName: [],
                });
                return;
            }

            try {
                const schemaName = await api.getDatabaseSchemas({
                    databaseName: filter.databaseName,
                    limit: 1000,
                });

                setDataSearch({
                    ...dataSearch,
                    schemaName: schemaName?.data?.data?.map((item: any) => ({
                        value: item.fullyQualifiedName,
                        label: item.name,
                    })),
                });
            } catch (error) {
                message.error('Failed to fetch schemas');
            }
        })();
    }, [filter.databaseName]);

    const columns = useMemo((): ColumnsType<any> => {
        return [
            { key: 'date', title: 'Date', dataIndex: 'Date' },
            { key: 'databaseName', title: 'Database', dataIndex: 'Database' },
            { key: 'schemaName', title: 'Schema', dataIndex: 'Schema' },
            { key: 'tableName', title: 'Table Name', dataIndex: 'Table Name' },
            { key: 'columnName', title: 'Column Name', dataIndex: 'Column Name' },
            { key: 'note', title: 'Note', dataIndex: 'Note' },
        ];
    }, [data]);

    const handleGetReportData = async () => {
        try {
            setIsFetching(true);
            setSavedStateFilter(filter);
            const response = await api.getTableColumnUpdate(
                filter.databaseName.split('.')[filter.databaseName.split('.').length - 1],
                filter.schemaName.map(
                    (item: string) => item.split('.')[item.split('.').length - 1]
                ),
                dayjs(filter.dateRange[0]).format('YYYY-MM-DD'),
                dayjs(filter.dateRange[1]).format('YYYY-MM-DD')
            );
            setData(response.data);
            setIsCheckReport(true);
        } catch (error) {
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            message.error(
                `Failed to load report: ${err.response?.data?.detail || err.message || 'Unknown error'}`
            );
        } finally {
            setIsFetching(false);
        }
    };

    const onChange = (dates: RangeValue) => {
        if (dates) {
            setFilter({ ...filter, dateRange: dates });
        } else {
            setFilter({ ...filter, dateRange: [] });
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.exportTableColumnUpdate(
                savedStateFilter.databaseName.split('.')[
                    savedStateFilter.databaseName.split('.').length - 1
                ],
                savedStateFilter.schemaName.map(
                    (item: string) => item.split('.')[item.split('.').length - 1]
                ),
                dayjs(savedStateFilter.dateRange[0]).format('YYYY-MM-DD'),
                dayjs(savedStateFilter.dateRange[1]).format('YYYY-MM-DD')
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'table-column-change-events-list.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        fetchGetDataSearch();
    }, []);

    const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
        { label: 'Today', value: [dayjs(), dayjs()] },
        { label: 'Last 3 Days', value: [dayjs().subtract(2, 'day'), dayjs()] },
        { label: 'Last 7 Days', value: [dayjs().subtract(6, 'day'), dayjs()] },
        { label: 'Last 14 Days', value: [dayjs().subtract(13, 'day'), dayjs()] },
        { label: 'Last 30 Days', value: [dayjs().subtract(29, 'day'), dayjs()] },
        {
            label: 'Last 90 Days',
            value: [dayjs().subtract(89, 'day').startOf('month'), dayjs().endOf('month')],
        },
    ];

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text strong>Date Range *</Typography.Text>
                        <RangePicker
                            presets={rangePresets}
                            value={filter.dateRange.length ? filter.dateRange : null}
                            onChange={onChange}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text strong>Database Name *</Typography.Text>
                        <Select
                            allowClear
                            showSearch
                            options={dataSearch?.databaseName?.map((item: any) => ({
                                label: item?.label,
                                value: item?.value,
                            }))}
                            placeholder="Search"
                            style={{ width: '300px' }}
                            value={filter.databaseName}
                            onChange={(value) => onChangeSelect(value, 'databaseName')}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text strong>Schema Name *</Typography.Text>
                        <Select
                            allowClear
                            showSearch
                            maxTagCount="responsive"
                            mode="multiple"
                            options={dataSearch?.schemaName?.map((item: any) => ({
                                label: item?.label,
                                value: item?.value,
                            }))}
                            placeholder="Search"
                            style={{ width: '300px' }}
                            value={filter.schemaName}
                            onChange={(value) => onChangeSelect(value, 'schemaName')}
                        />
                    </div>
                    <Button
                        disabled={
                            !filter?.dateRange.length ||
                            !filter?.databaseName?.length ||
                            !filter?.schemaName?.length
                        }
                        icon={<FileSearchOutlined />}
                        loading={isFetching}
                        type="primary"
                        onClick={handleGetReportData}
                    >
                        View Report
                    </Button>
                </div>
            </Col>

            {isCheckReport && (
                <Col span={24}>
                    <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                        <Button
                            disabled={isExporting}
                            icon={<UploadOutlined />}
                            loading={isExporting}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                    </div>
                    <Table
                        bordered
                        columns={columns}
                        dataSource={data}
                        locale={{
                            emptyText: <Empty description="No Data" />,
                        }}
                        pagination={{
                            size: 'default',
                            showTotal: (total) => `Total ${total} items`,
                            showSizeChanger: true,
                        }}
                        size="small"
                    />
                </Col>
            )}
        </Row>
    );
}

export default Report1;
