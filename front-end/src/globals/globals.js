import axios from "axios";
import { Logger } from "../utils/logger";
import {
  reloadPage, apiGet, apiGetById, apiPost, apiPut,
  apiPatch, apiDelete, isStrongPassword,convertImageToBase64, getFullNameById,  hasPermission, hasRole,getFileUrl
} from "../utils/utils"; // Adjust the path to match your project structure
export default {

  install(app) {
    // Check environment and set base URL
    const isProduction = import.meta.env.MODE === "production";
    const baseUrl = isProduction
      ? import.meta.env.VITE_APP_BASE_URL_PRODUCTION
      : import.meta.env.VITE_APP_BASE_URL_LOCAL;
    // Create the API client
    const apiClient = axios.create({
      baseURL: baseUrl,
    });

    let banks = [];
    banks = [
      { value: "LIB", name: "LIB" },
      { value: "WEGAGEN", name: "WEGAGEN" },
      { value: "ABSINIA", name: "ABSINIA" },
      { value: "CBE", name: "CBE" },
    ];
    // Generate the array of years (from now - 5 years up to now + 50 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 56 }, (v, i) => currentYear - 5 + i);

    const months = [
      { value: 1, name: "January" },
      { value: 2, name: "February" },
      { value: 3, name: "March" },
      { value: 4, name: "April" },
      { value: 5, name: "May" },
      { value: 6, name: "June" },
      { value: 7, name: "July" },
      { value: 8, name: "August" },
      { value: 9, name: "September" },
      { value: 10, name: "October" },
      { value: 11, name: "November" },
      { value: 12, name: "December" },
    ];

    const reportTypes = [
      { value: "allTime", name: "All Time" },
      { value: "annually", name: "Annually" },
      { value: "semiAnnually", name: "Semi-Annually" },
      { value: "monthly", name: "Monthly" },
      { value: "weekly", name: "Weekly" },
      { value: "daily", name: "Daily" },
      { value: "other", name: "Interval Period" },
    ];

    const days = Array.from({ length: 31 }, (v, i) => i + 1);
    const globalProperties = {
      $apiClient: apiClient,
      $otherVariable: "othervariable",
      $years: years,
      $months: months,
      $days: days,
      $banks: banks,
      $reportTypes: reportTypes,
      $getFullNameById: getFullNameById,
      $reloadPage: reloadPage,
      $apiGet: apiGet,
      $apiGetById: apiGetById,
      $apiPost: apiPost,
      $apiPut: apiPut,
      $apiPatch: apiPatch,
      $apiDelete: apiDelete,
      $isStrongPassword: isStrongPassword,
    
      $logger: Logger,
      $convertImageToBase64: convertImageToBase64,
      $hasPermission: hasPermission,
      $hasRole: hasRole,
     
      $getFileUrl: getFileUrl
    };
    // Assign to the global properties in the Vue app
    app.config.globalProperties = {
      ...app.config.globalProperties,
      ...globalProperties,
    };
  },
};
