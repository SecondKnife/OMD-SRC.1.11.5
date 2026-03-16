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
import {
    Card,
    Col,
    Empty,
    Input,
    Pagination,
    Progress,
    Row,
    Select,
    Spin,
    Table,
    Typography,
} from 'antd';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../utils/api';
import { usePaging } from '../hooks/usePaging';


interface TestSummary {
    total?: number;
    success?: number;
    failed?: number;
    aborted?: number;
}

interface TestSuiteRecord {
    id: string;
    name: string;
    fullyQualifiedName?: string;
    executable?: boolean;
    executableEntityReference?: {
        name?: string;
        fullyQualifiedName?: string;
    };
    summary?: TestSummary;
    owner?: {
        name?: string;
        displayName?: string;
        fullyQualifiedName?: string;
    };
}

const SummaryCard: React.FC<{
    title: string;
    value: number;
    total: number;
    type?: 'default' | 'success' | 'aborted' | 'failed';
    isLoading?: boolean;
}> = ({ title, value, total, type = 'default', isLoading }) => {
    const colorMap = {
        default: '#1890ff',
        success: '#52c41a',
        aborted: '#faad14',
        failed: '#ff4d4f',
    };
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const showProgress = type !== 'default';

    return (
        <Card size="small" style={{ height: '100%' }}>
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 16 }}>
                    <Spin indicator={<LoadingOutlined spin />} />
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {title}
                        </Typography.Text>
                        <Typography.Title level={3} style={{ margin: 0 }}>
                            {value}
                        </Typography.Title>
                    </div>
                    {showProgress && (
                        <Progress
                            type="circle"
                            percent={percent}
                            size={56}
                            strokeColor={colorMap[type]}
                            format={(p) => `${p}%`}
                        />
                    )}
                </div>
            )}
        </Card>
    );
};

const ByTablesPage: React.FC = () => {
    const [summary, setSummary] = useState<TestSummary>({
        total: 0,
        success: 0,
        failed: 0,
        aborted: 0,
    });
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [testSuites, setTestSuites] = useState<TestSuiteRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { currentPage, pageSize, onPageChange, onShowSizeChange, setCurrentPage } = usePaging({
        defaultPageSize: 10,
        persistenceKey: 'byTablesPageSize',
    });
    const [total, setTotal] = useState(0);

    const [searchValue, setSearchValue] = useState('');

    const fetchSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        try {
            const response = await api.getTestCaseExecutionSummary();
            setSummary(response.data || {});
        } catch (error) {
            console.error('Failed to fetch test summary:', error);
        } finally {
            setIsSummaryLoading(false);
        }
    }, []);

    const fetchTestSuites = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.getTestSuitesBySearch({
                fields: 'owner,summary',
                q: searchValue ? `*${searchValue}*` : undefined,
                currentPage,
                pageSize,
                includeEmptyTestSuites: false,
                testSuiteType: 'executable',
                sortField: 'testCaseResultSummary.timestamp',
                sortType: 'desc',
                sortNestedPath: 'testCaseResultSummary',
                sortNestedMode: ['max'],
            });

            setTestSuites(response.data?.data || []);
            setTotal(response.data?.paging?.total || 0);
        } catch (error) {
            console.error('Failed to fetch test suites:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchValue]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchTestSuites();
    }, [fetchTestSuites]);

    const columns = useMemo((): ColumnsType<TestSuiteRecord> => {
        return [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                sorter: (a, b) => {
                    const aName = a.executableEntityReference?.fullyQualifiedName || a.fullyQualifiedName || '';
                    const bName = b.executableEntityReference?.fullyQualifiedName || b.fullyQualifiedName || '';
                    return aName.localeCompare(bName);
                },
                render: (_: any, record: TestSuiteRecord) => {
                    const name = record.executable
                        ? record.executableEntityReference?.fullyQualifiedName ||
                        record.executableEntityReference?.name
                        : record.fullyQualifiedName || record.name;
                    return <Typography.Text strong>{name}</Typography.Text>;
                },
            },
            {
                title: 'Tests',
                dataIndex: 'summary',
                key: 'tests',
                width: 100,
                render: (val: TestSummary) => val?.total ?? 0,
            },
            {
                title: 'Success %',
                dataIndex: 'summary',
                key: 'success',
                width: 200,
                render: (val: TestSummary) => {
                    const percent =
                        val?.total && val?.success
                            ? Math.round((val.success / val.total) * 100)
                            : 0;
                    return (
                        <Progress
                            percent={percent}
                            strokeColor={{
                                '0%': '#52c41a',
                                '100%': '#52c41a',
                            }}
                            trailColor="#ff4d4f"
                            size="small"
                            format={(p) => `${p}%`}
                        />
                    );
                },
            },
            {
                title: 'Owner',
                dataIndex: 'owner',
                key: 'owner',
                width: 200,
                render: (owner: TestSuiteRecord['owner']) =>
                    owner ? (
                        <Typography.Text>
                            {owner.displayName || owner.name || '--'}
                        </Typography.Text>
                    ) : (
                        <Typography.Text type="secondary">--</Typography.Text>
                    ),
            },
        ];
    }, []);

    const summaryPanel = (
        <Row gutter={[16, 16]}>
            <Col span={6}>
                <SummaryCard
                    title="Total Tests"
                    value={summary.total ?? 0}
                    total={summary.total ?? 0}
                    isLoading={isSummaryLoading}
                />
            </Col>
            <Col span={6}>
                <SummaryCard
                    title="Success"
                    value={summary.success ?? 0}
                    total={summary.total ?? 0}
                    type="success"
                    isLoading={isSummaryLoading}
                />
            </Col>
            <Col span={6}>
                <SummaryCard
                    title="Aborted"
                    value={summary.aborted ?? 0}
                    total={summary.total ?? 0}
                    type="aborted"
                    isLoading={isSummaryLoading}
                />
            </Col>
            <Col span={6}>
                <SummaryCard
                    title="Failed"
                    value={summary.failed ?? 0}
                    total={summary.total ?? 0}
                    type="failed"
                    isLoading={isSummaryLoading}
                />
            </Col>
        </Row>
    );

    return (
        <Row gutter={[16, 16]} style={{ padding: '16px 24px' }}>
            <Col span={24}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Input
                            placeholder="Search..."
                            prefix={<SearchOutlined />}
                            style={{ width: 300 }}
                            value={searchValue}
                            allowClear
                            onChange={(e) => {
                                setSearchValue(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </Col>
                </Row>
            </Col>

            <Col span={24}>{summaryPanel}</Col>

            <Col span={24}>
                <Table
                    bordered
                    columns={columns}
                    dataSource={testSuites}
                    loading={isLoading}
                    locale={{
                        emptyText: (
                            <Empty description="No result found. Try adjusting your search or filter to find what you are looking for." />
                        ),
                    }}
                    pagination={false}
                    rowKey="id"
                    size="small"
                />
            </Col>
            <Col span={24}>
                <Pagination
                    showSizeChanger
                    style={{ textAlign: 'center', marginBottom: 16 }}
                    current={currentPage}
                    pageSize={pageSize}
                    pageSizeOptions={[10, 25, 50]}
                    showTotal={(t) => `Total records: ${t}`}
                    total={total}
                    onChange={onPageChange}
                    onShowSizeChange={onShowSizeChange}
                />
            </Col>

        </Row>
    );
};

export default ByTablesPage;
