const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://erp.palmtechnology.net';
const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || 'PALM-01';

export const API_ENDPOINTS = {
  
  HELP_CENTER: `${API_BASE_URL}/api/get-help_center`,
  HELP_CENTER_WITH_COMPANY: `${API_BASE_URL}/api/get-help_center/${DEFAULT_COMPANY_ID}`,
  
  VIDEO_CENTER: `${API_BASE_URL}/api/get-help_center_video`,
  VIDEO_CENTER_WITH_COMPANY: `${API_BASE_URL}/api/get-help_center_video/${DEFAULT_COMPANY_ID}`,
  
  getHelpCenter: (companyId?: string) => 
    `${API_BASE_URL}/api/get-help_center/${companyId || DEFAULT_COMPANY_ID}`,
    
  getVideoCenter: (companyId?: string) => 
    `${API_BASE_URL}/api/get-help_center_video/${companyId || DEFAULT_COMPANY_ID}`,
};

export const CONFIG = {
  API_BASE_URL,
  DEFAULT_COMPANY_ID,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

