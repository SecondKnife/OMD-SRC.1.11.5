import { useState } from 'react';
import { Upload, Button, message, Tabs } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import api from '../utils/api';

const { Dragger } = Upload;

const CustomUploadPage: React.FC = () => {
    const [dictionaryFiles, setDictionaryFiles] = useState<UploadFile[]>([]);
    const [glossaryFiles, setGlossaryFiles] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleDictionaryUpload = async () => {
        if (dictionaryFiles.length === 0) {
            message.error('Please select files to upload');
            return;
        }

        setUploading(true);
        try {
            const fileList = dictionaryFiles
                .map((f) => f.originFileObj)
                .filter((file): file is RcFile => !!file);
            const dt = new DataTransfer();
            fileList.forEach((file) => dt.items.add(file));

            await api.uploadDictionary(dt.files);
            message.success(`Successfully uploaded ${dictionaryFiles.length} file(s)`);
            setDictionaryFiles([]);
        } catch (error) {
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            message.error(
                `Upload failed: ${err.response?.data?.detail || err.message || 'Unknown error'}`
            );
        } finally {
            setUploading(false);
        }
    };

    const handleGlossaryUpload = async () => {
        if (glossaryFiles.length === 0) {
            message.error('Please select files to upload');
            return;
        }

        setUploading(true);
        try {
            const fileList = glossaryFiles
                .map((f) => f.originFileObj)
                .filter((file): file is RcFile => !!file);
            const dt = new DataTransfer();
            fileList.forEach((file) => dt.items.add(file));

            await api.uploadGlossary(dt.files);
            message.success(`Successfully uploaded ${glossaryFiles.length} file(s)`);
            setGlossaryFiles([]);
        } catch (error) {
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            message.error(
                `Upload failed: ${err.response?.data?.detail || err.message || 'Unknown error'}`
            );
        } finally {
            setUploading(false);
        }
    };

    const tabItems = [
        {
            key: '1',
            label: 'Upload Dictionary',
            children: (
                <>
                    <Dragger
                        multiple
                        fileList={dictionaryFiles}
                        beforeUpload={(file, fileList) => {
                            setDictionaryFiles((prev) => [
                                ...prev,
                                ...fileList.map((f) =>
                                    Object.assign(f, { uid: f.uid || `${Date.now()}-${f.name}` })
                                ),
                            ]);
                            return false;
                        }}
                        onRemove={(file) => {
                            setDictionaryFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Click or drag Excel files to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                            Support for single or bulk upload. Only .xlsx files are accepted.
                        </p>
                    </Dragger>
                    <Button
                        type="primary"
                        onClick={handleDictionaryUpload}
                        loading={uploading}
                        style={{ marginTop: 16 }}
                    >
                        Upload Dictionary
                    </Button>
                </>
            ),
        },
        {
            key: '2',
            label: 'Upload Glossary',
            children: (
                <>
                    <Dragger
                        multiple
                        fileList={glossaryFiles}
                        beforeUpload={(file, fileList) => {
                            setGlossaryFiles((prev) => [
                                ...prev,
                                ...fileList.map((f) =>
                                    Object.assign(f, { uid: f.uid || `${Date.now()}-${f.name}` })
                                ),
                            ]);
                            return false;
                        }}
                        onRemove={(file) => {
                            setGlossaryFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Click or drag Excel files to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                            Support for single or bulk upload. Only .xlsx files are accepted.
                        </p>
                    </Dragger>
                    <Button
                        type="primary"
                        onClick={handleGlossaryUpload}
                        loading={uploading}
                        style={{ marginTop: 16 }}
                    >
                        Upload Glossary
                    </Button>
                </>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <h1>Upload Files</h1>
            <Tabs defaultActiveKey="1" items={tabItems} />
        </div>
    );
};

export default CustomUploadPage;
