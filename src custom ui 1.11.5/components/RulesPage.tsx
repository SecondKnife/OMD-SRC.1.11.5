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
    FileExcelOutlined,
    InboxOutlined,
    LoadingOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Col,
    Empty,
    Pagination,
    Row,
    Spin,
    Table,
    Upload,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import api from '../utils/api';
import { usePaging } from '../hooks/usePaging';


const { Dragger } = Upload;

const RulesPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [file, setFile] = useState<UploadFile>();
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorValidationFile, setErrorValidationFile] = useState<string[]>([]);
    const { currentPage, pageSize, onPageChange, onShowSizeChange, setCurrentPage } = usePaging({
        defaultPageSize: 10,
        persistenceKey: 'rulesPageSize',
    });

    const [total, setTotal] = useState(0);

    const fetchRulesTable = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await api.getRulesTable({
                currentPage,
                pageSize,
            });
            setData(result.data?.data || []);
            setTotal(result.data?.paging?.total || 0);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize]);


    useEffect(() => {
        fetchRulesTable();
    }, [fetchRulesTable]);

    const validateFile = (uploadFile: UploadFile): string[] => {
        const errors: string[] = [];
        if (
            uploadFile.type !==
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            errors.push('Invalid file format. Please upload a .xlsx file.');
        }
        if (uploadFile.size && uploadFile.size > 5 * 1024 * 1024) {
            errors.push('File size exceeds the 5MB limit. Please upload a file smaller than 5MB.');
        }
        return errors;
    };

    const onHandleChangeFile: UploadProps['onChange'] = (info) => {
        if (info.fileList.length === 0) {
            setFile(undefined);
            setErrorValidationFile([]);
            return;
        }
        setFile(info.file);
        const errors = validateFile(info.file);
        setErrorValidationFile(errors);
    };

    const processUpload = async (uploadFile: UploadFile) => {
        const errors = validateFile(uploadFile);
        if (errors.length > 0) {
            setErrorValidationFile(errors);
            return;
        }

        try {
            setIsUploading(true);
            const fileName = uploadFile.name?.split('.')[0] || '';
            const presigned = await api.generateUploadPresignedUrl(fileName);

            const response = await axios.put(presigned.data?.data?.url, uploadFile, {
                headers: { 'Content-Type': uploadFile.type },
            });

            if (response.status === 200) {
                const validate = await api.checkFileValidation(presigned.data?.data?.fileName);
                if (validate.data?.message === 'Validate rules file successfully') {
                    fetchRulesTable();
                    setFile(undefined);
                    setErrorValidationFile([]);
                }
            }
        } catch (error: any) {
            if ((error as AxiosError).response?.status === 400) {
                setFile(undefined);
                setErrorValidationFile([...(error.response?.data?.message || ['Upload failed'])]);
            } else {
                setErrorValidationFile(['Unable to process the request at this time']);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const onUpload = () => {
        if (file) processUpload(file);
    };

    const onHandleUploadFile: UploadProps['onChange'] = (info) => {
        setFile(info.file);
        processUpload(info.file);
    };

    const columns = useMemo((): ColumnsType<any> => {
        return [
            { key: 'serviceName', title: 'Service Name', dataIndex: 'serviceName' },
            { key: 'databaseName', title: 'Database Name', dataIndex: 'databaseName' },
            { key: 'schemaName', title: 'Schema Name', dataIndex: 'schemaName' },
            { key: 'tableName', title: 'Table Name', dataIndex: 'tableName' },
            { key: 'columnName', title: 'Column Name', dataIndex: 'columnName' },
            { key: 'term', title: 'Term', dataIndex: 'term' },
            { key: 'completeness', title: 'Completeness', dataIndex: 'completeness' },
            { key: 'completenessDesc', title: 'Completeness Desc', dataIndex: 'completenessDesc' },
            { key: 'validity', title: 'Validity', dataIndex: 'validity' },
            { key: 'validityDesc', title: 'Validity Desc', dataIndex: 'validityDesc' },
            { key: 'accuracy', title: 'Accuracy', dataIndex: 'accuracy' },
            { key: 'accuracyDesc', title: 'Accuracy Desc', dataIndex: 'accuracyDesc' },
            { key: 'uniqueness', title: 'Uniqueness', dataIndex: 'uniqueness' },
            { key: 'uniquenessDesc', title: 'Uniqueness Desc', dataIndex: 'uniquenessDesc' },
            { key: 'consistency', title: 'Consistency', dataIndex: 'consistency' },
            { key: 'consistencyDesc', title: 'Consistency Desc', dataIndex: 'consistencyDesc' },
            { key: 'activeRule', title: 'Active Rule', dataIndex: 'activeRule' },
            { key: 'sampleSize', title: 'Sample Size', dataIndex: 'sampleSize' },
            { key: 'note', title: 'Note', dataIndex: 'note' },
            { key: 'role', title: 'Role', dataIndex: 'role' },
            { key: 'ownerRole', title: 'Owner Role', dataIndex: 'ownerRole' },
        ];
    }, [data]);

    const errorAlert = errorValidationFile.length > 0 && (
        <Col span={24} style={{ marginTop: '20px' }}>
            <Alert
                showIcon
                type="error"
                description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {errorValidationFile.map((msg, index) => (
                            <li key={index}>{msg}</li>
                        ))}
                    </ul>
                }
            />
        </Col>
    );

    if (isLoading && data.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <Row gutter={[16, 16]} style={{ padding: '16px 24px' }}>
                <Col span={24}>
                    <Dragger
                        accept=".xlsx"
                        beforeUpload={() => false}
                        fileList={file ? [file] : []}
                        multiple={false}
                        showUploadList={{ showRemoveIcon: true }}
                        onChange={onHandleChangeFile}
                        onRemove={() => setFile(undefined)}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Click or drag file to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                            Only support for .xlsx
                            <br />
                            File size should be less than 5MB
                        </p>
                    </Dragger>
                </Col>
                {file && errorValidationFile.length === 0 && (
                    <Col span={24} style={{ textAlign: 'center', marginTop: 20 }}>
                        <Button
                            icon={<UploadOutlined />}
                            loading={isUploading}
                            type="primary"
                            onClick={onUpload}
                        >
                            Upload File
                        </Button>
                    </Col>
                )}
                {errorAlert}
            </Row>
        );
    }

    return (
        <Row gutter={[16, 16]} style={{ padding: '16px 24px' }}>
            <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileExcelOutlined />
                            <span style={{ fontWeight: 600 }}>{data?.[0]?.file}</span>
                        </div>
                        <span style={{ color: '#6b7280' }}>
                            Uploaded by {data?.[0]?.file?.split('_')[1]} on{' '}
                            {dayjs(data?.[0]?.file?.split('_')[2]?.split('.')[0]).format('DD/MM/YYYY')}
                        </span>
                    </div>
                    <Upload
                        accept=".xlsx"
                        beforeUpload={() => false}
                        showUploadList={false}
                        onChange={onHandleUploadFile}
                    >
                        <Button icon={<UploadOutlined />} loading={isUploading}>
                            New File
                        </Button>
                    </Upload>
                </div>
            </Col>
            {errorAlert}
            <Col span={24}>
                <Table
                    bordered
                    columns={columns}
                    dataSource={data}
                    loading={isLoading}
                    locale={{ emptyText: <Empty description="No Data" /> }}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
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

export default RulesPage;
