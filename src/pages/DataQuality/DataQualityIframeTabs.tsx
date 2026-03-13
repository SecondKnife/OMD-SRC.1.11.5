import { CustomRoutes } from '../../enums/CustomRoutes';

const DQIframeTab = ({ src }: { src: string }) => {
  return (
    <iframe
      src={src}
      title={src}
      style={{ width: '100%', height: 'calc(100vh - 220px)', border: 'none' }}
    />
  );
};

export const ByTablesTab = () => <DQIframeTab src={CustomRoutes.DQ_BY_TABLES} />;
export const ByRulesTab = () => <DQIframeTab src={CustomRoutes.DQ_BY_RULES} />;
export const ResultsTab = () => <DQIframeTab src={CustomRoutes.DQ_RESULTS} />;
