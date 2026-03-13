const normalizeBaseUrl = (baseUrl: string) => {
  return baseUrl.replace(/\/+$/, '');
};

const resolvedCustomUiBaseUrl =
  (import.meta.env.VITE_CUSTOM_UI_BASE_URL as string | undefined) ??
  (process.env.VITE_CUSTOM_UI_BASE_URL as string | undefined) ??
  '/custom-ui';

const CUSTOM_UI_BASE_URL = normalizeBaseUrl(resolvedCustomUiBaseUrl);

export const CustomRoutes = {
  UPLOAD: `${CUSTOM_UI_BASE_URL}/upload`,
  REPORT: `${CUSTOM_UI_BASE_URL}/report`,
  DQ_BY_TABLES: `${CUSTOM_UI_BASE_URL}/data-quality/tables`,
  DQ_BY_RULES: `${CUSTOM_UI_BASE_URL}/data-quality/rules`,
  DQ_RESULTS: `${CUSTOM_UI_BASE_URL}/data-quality/results`,
  COLUMN_RELATION: `${CUSTOM_UI_BASE_URL}/column-relation`,
  COLUMN_RELATION_PICKER: `${CUSTOM_UI_BASE_URL}/column-relation/picker`,
} as const;

export type CustomRoute = (typeof CustomRoutes)[keyof typeof CustomRoutes];