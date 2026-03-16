import { useState } from 'react';
import { Select } from 'antd';
import Report1 from './Report1';
import Report2 from './Report2';
import Report3 from './Report3';

const ReportPage: React.FC = () => {
    const [reportType, setReportType] = useState('lineage-changes');

    const renderReport = () => {
        switch (reportType) {
            case 'column-changes':
                return <Report1 />;
            case 'lineage-changes':
                return <Report2 />;
            case 'table-relationships':
                return <Report3 />;
            default:
                return <Report2 />;
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1>Reports</h1>
            <div style={{ marginBottom: 16 }}>
                <Select
                    value={reportType}
                    onChange={setReportType}
                    style={{ width: 300, marginRight: 16 }}
                    options={[
                        { value: 'lineage-changes', label: 'Lineage Changes' },
                        { value: 'table-relationships', label: 'Table Relationships' },
                        { value: 'column-changes', label: 'Column Changes' },
                    ]}
                />
            </div>
            {renderReport()}
        </div>
    );
};

export default ReportPage;
