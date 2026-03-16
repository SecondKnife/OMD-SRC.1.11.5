import { Route, Routes, Link } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import CustomUploadPage from './components/CustomUploadPage';
import ReportPage from './components/ReportPage';
import RulesPage from './components/RulesPage';
import ResultsPage from './components/ResultsPage';
import ByTablesPage from './components/ByTablesPage';

const { Content } = Layout;

const App: React.FC = () => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#7147E8',
                },
            }}
        >
            <Layout style={{ minHeight: '100vh', background: '#fff' }}>
                <Content>
                    <Routes>
                        <Route path="/upload" element={<CustomUploadPage />} />
                        <Route path="/report" element={<ReportPage />} />
                        <Route path="/data-quality/tables" element={<ByTablesPage />} />
                        <Route path="/data-quality/rules" element={<RulesPage />} />
                        <Route path="/data-quality/results" element={<ResultsPage />} />
                        <Route
                            path="/"
                            element={
                                <div style={{ padding: 24 }}>
                                    <h1>OpenMetadata Custom Service</h1>
                                    <p>Navigate to:</p>
                                    <ul>
                                        <li>
                                            <Link to="/upload">Upload (Dictionary & Glossary)</Link>
                                        </li>
                                        <li>
                                            <Link to="/report">Reports</Link>
                                        </li>
                                        <li>
                                            <Link to="/data-quality/tables">Data Quality - By Tables</Link>
                                        </li>
                                        <li>
                                            <Link to="/data-quality/rules">Data Quality - By Rules</Link>
                                        </li>
                                        <li>
                                            <Link to="/data-quality/results">Data Quality - Results</Link>
                                        </li>
                                    </ul>
                                </div>
                            }
                        />
                    </Routes>
                </Content>
            </Layout>
        </ConfigProvider>
    );
};

export default App;
