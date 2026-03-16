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
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FileSearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, Row, Select, Typography, Table, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { debounce } from 'lodash';
import api from '../utils/api';

function Report3() {
    const [data, setData] = useState<any>([]);
    const [inputLayer, setInputLayer] = useState<any>([]);
    const [dataSearch, setDataSearch] = useState<any>({
        inputTable: [],
        inputColumn: [],
    });
    const [filter, setFilter] = useState<any>({
        inputTable: [],
        inputColumn: [],
        inputLayer: '',
    });
    const [isCheckReport, setIsCheckReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [savedStateFilter, setSavedStateFilter] = useState<any>({
        inputTable: '',
        inputColumn: '',
        inputLayer: '',
    });
    const [searchTable, setSearchTable] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const response = await api.getReportLayer();
                const convertData = response?.data?.map(
                    (item: { layerName: string; layerDisplay: string }) => ({
                        label: item.layerDisplay,
                        value: item.layerName,
                    })
                );
                setInputLayer(convertData);
                setFilter({
                    inputTable: [],
                    inputColumn: [],
                    inputLayer: 'eod',
                });
            } catch (e) {
                // Suppress initial error if data not ready
            }
        })();
    }, []);

    const onChangeSelect = (value: string[] | any, key: string) => {
        if (key === 'inputColumn') {
            setFilter({
                ...filter,
                inputColumn: value,
            });
            return;
        }

        if (key === 'inputLayer') {
            setFilter({
                ...filter,
                inputLayer: value,
                inputTable: [],
                inputColumn: [],
            });
            setDataSearch({
                ...dataSearch,
                inputTable: [],
                inputColumn: [],
            });
        }
    };

    const onAddNewFilter = (value: string) => {
        const newColumn = [
            ...filter.inputTable,
            dataSearch.inputTable.find((table: any) => table.fqn === value),
        ];
        setFilter({
            ...filter,
            inputTable: newColumn,
        });

        setDataSearch((prevState: any) => ({
            ...prevState,
            inputColumn: newColumn.flatMap((item: any) => item.columns || []),
        }));
    };

    const onClearFilter = () => {
        setFilter({
            ...filter,
            inputTable: [],
        });

        setDataSearch({
            ...dataSearch,
            inputColumn: [],
        });
    };

    const onDeselectFilter = (value: string) => {
        const newColumn = filter.inputTable.filter((table: any) => table.fqn !== value);

        setFilter({
            ...filter,
            inputTable: newColumn,
        });

        setDataSearch({
            ...dataSearch,
            inputColumn: newColumn?.flatMap((item: any) => item.columns),
        });
    };

    const fetchGetDataSearch = useCallback(
        async (searchValue?: string) => {
            try {
                const tableList = await api.getListTableByLayer(
                    filter.inputLayer,
                    searchValue?.length === 0 ? searchValue : searchTable
                );

                setDataSearch({
                    ...dataSearch,
                    inputTable: tableList?.data || [],
                    inputColumn: filter.inputTable.flatMap((table: any) => table?.columns || []),
                });
            } catch (error) {
                // Can fail if layer is invalid
            }
        },
        [filter, searchTable, dataSearch]
    );

    const debounceSearch = useRef(
        debounce((searchValue: string) => fetchGetDataSearch(searchValue), 500)
    );

    useEffect(() => {
        debounceSearch.current(searchTable);
    }, [searchTable]);

    useEffect(() => {
        setFilter({
            ...filter,
            inputTable: [],
            inputColumn: [],
        });
        if (!filter.inputLayer) {
            setDataSearch({
                ...dataSearch,
                inputColumn: [],
                inputTable: [],
            });
            return;
        }

        fetchGetDataSearch();
    }, [filter.inputLayer]);

    const columns = useMemo((): ColumnsType<any> => {
        return [
            { key: 'table_name', title: 'Table Name', dataIndex: 'Table_name' },
            { key: 'column_Name', title: 'Column Name', dataIndex: 'Column_name' },
            { key: 'related_level', title: 'Related Level', dataIndex: 'Related_level' },
            { key: 'related_layer', title: 'Related Layer', dataIndex: 'Related_layer' },
            { key: 'related_table', title: 'Related Table', dataIndex: 'Related_table' },
            { key: 'related_column', title: 'Related Column', dataIndex: 'Related_column' },
        ];
    }, [data]);

    const handleGetReportData = async () => {
        try {
            setIsFetching(true);
            const response = await api.getTableRelationships(
                filter.inputTable.map((item: any) => item.fqn),
                filter.inputColumn
            );
            setData(response.data);
            setIsCheckReport(true);
        } catch (error) {
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            message.error(`Failed: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsFetching(false);
            setSavedStateFilter(filter);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.exportTableRelationships(
                savedStateFilter.inputTable.map((item: any) => item.fqn),
                savedStateFilter.inputColumn
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'table-relationship-list.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text strong>Input layer *</Typography.Text>
                        <Select
                            allowClear
                            showSearch
                            options={inputLayer?.map((item: any) => ({
                                label: item?.label,
                                value: item?.value,
                            }))}
                            placeholder="Search"
                            style={{ width: '300px' }}
                            value={filter.inputLayer}
                            onChange={(value) => onChangeSelect(value, 'inputLayer')}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text strong>Input table *</Typography.Text>
                        <Select
                            allowClear
                            showSearch
                            maxTagCount="responsive"
                            mode="multiple"
                            options={dataSearch?.inputTable?.map((item: any) => ({
                                label: item?.name,
                                value: item?.fqn,
                            }))}
                            placeholder="Search"
                            searchValue={searchTable}
                            style={{ width: '300px' }}
                            value={filter?.inputTable?.map((item: any) => item?.fqn) || []}
                            onClear={() => {
                                onClearFilter();
                                setSearchTable('');
                            }}
                            onDeselect={(value: string) => {
                                onDeselectFilter(value);
                            }}
                            onSearch={(value: string) => {
                                setSearchTable(value);
                            }}
                            onSelect={(value: string) => {
                                onAddNewFilter(value);
                                setSearchTable('');
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography.Text strong>Input column</Typography.Text>
                        <Select
                            allowClear
                            showSearch
                            maxTagCount="responsive"
                            mode="multiple"
                            options={dataSearch?.inputColumn?.map((item: any) => ({
                                label: item?.fullyQualifiedName,
                                value: item?.fullyQualifiedName,
                            }))}
                            placeholder="Search"
                            style={{ width: '500px' }}
                            value={filter?.inputColumn}
                            onChange={(value) => onChangeSelect(value, 'inputColumn')}
                        />
                    </div>
                    <Button
                        disabled={!filter?.inputLayer?.length || filter?.inputTable?.length === 0}
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
                        scroll={{ x: 'max-content' }}
                        size="small"
                    />
                </Col>
            )}
        </Row>
    );
}

export default Report3;
