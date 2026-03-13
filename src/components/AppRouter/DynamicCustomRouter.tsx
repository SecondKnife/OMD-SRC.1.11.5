import { CustomRoute } from '../../enums/CustomRoutes';

const DynamicCustomRouter = ({ route }: { route: CustomRoute }) => {
  return (
    <iframe
      src={route}
      title={route}
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};

export default DynamicCustomRouter;