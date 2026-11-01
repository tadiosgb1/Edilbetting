import axios from "axios";
import router from "../router";
import store from "../store";

// ─────────────────────────────────────────────────────────────────────────────
//  Base URL helper
// ─────────────────────────────────────────────────────────────────────────────
function getBaseUrl() {
  const isProd = import.meta.env.MODE === "production";
  return isProd
    ? import.meta.env.VITE_APP_BASE_URL_PRODUCTION
    : import.meta.env.VITE_APP_BASE_URL_LOCAL;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Single shared Axios instance  (interceptors attached once)
// ─────────────────────────────────────────────────────────────────────────────
let _client = null;
let _isRefreshing = false;
let _refreshQueue = []; // callbacks waiting for the new access token

function processQueue(error, token = null) {
  _refreshQueue.forEach(cb => (error ? cb.reject(error) : cb.resolve(token)));
  _refreshQueue = [];
}

export function getApiClient() {
  if (_client) return _client;

  _client = axios.create({ baseURL: getBaseUrl() });

  // ── Request interceptor: attach latest access token ──────────────────────
  _client.interceptors.request.use(config => {
    const token = localStorage.getItem("access");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });

  // ── Response interceptor: handle 401 → silent refresh ────────────────────
  _client.interceptors.response.use(
    response => response,
    async error => {
      const original = error.config;

      // Only attempt refresh on 401, and only once per request
      if (
        error.response?.status === 401 &&
        !original._retry &&
        localStorage.getItem("refreshToken")
      ) {
        if (_isRefreshing) {
          // Queue this request until the in-flight refresh completes
          return new Promise((resolve, reject) => {
            _refreshQueue.push({ resolve, reject });
          }).then(newToken => {
            original.headers["Authorization"] = `Bearer ${newToken}`;
            return _client(original);
          });
        }

        original._retry = true;
        _isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          const { data } = await axios.post(
            `${getBaseUrl()}/auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefresh } = data;

          // Persist the new tokens
          localStorage.setItem("access", accessToken);
          localStorage.setItem("token", accessToken);   // keep legacy key in sync
          if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

          processQueue(null, accessToken);
          original.headers["Authorization"] = `Bearer ${accessToken}`;
          return _client(original);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh failed → force logout
          _forceLogout();
          return Promise.reject(refreshError);
        } finally {
          _isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return _client;
}

function _forceLogout() {
  localStorage.removeItem("access");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("roles");
  localStorage.removeItem("permissions");
  store.dispatch("logout").catch(() => {});
  router.push("/").catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
//  Header builder
// ─────────────────────────────────────────────────────────────────────────────
function getDefaultHeaders(customHeaders = {}) {
  const token = localStorage.getItem("access");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...customHeaders,
  };
  // Let Axios set the multipart boundary automatically
  if (customHeaders["Content-Type"] === "multipart/form-data") {
    delete headers["Content-Type"];
  }
  return headers;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Error handler
// ─────────────────────────────────────────────────────────────────────────────
function handleApiError(error) {
  let status = 0;
  let message = "An unexpected error occurred.";

  if (error.response) {
    status = error.response.status;

    if (status === 401 && error.response.data?.error?.option === 1) return;

    const clientErrors = {
      400: "Bad Request. Please check your input.",
      401: "Unauthorized. Please log in.",
      403: "Forbidden. You don't have permission.",
      404: "Resource not found.",
      409: "Conflict with current resource state.",
      429: "Too many requests. Slow down!",
    };
    const serverErrors = {
      500: "Internal server error.",
      502: "Bad gateway.",
      503: "Service unavailable.",
      504: "Gateway timeout.",
    };

    if (status >= 400 && status < 500) {
      message = error.response.data?.error || error.response.data?.message
        || clientErrors[status] || `Client Error: ${status}`;
    } else if (status >= 500) {
      message = error.response.data?.error || error.response.data?.message
        || serverErrors[status] || `Server Error: ${status}`;
    }
  } else if (error.request) {
    message = "No response from server. Check your connection.";
  } else {
    message = error.message || message;
  }

  console.error("API Error:", { status, message });
  throw { status, message };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public API helpers
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGet(url, params = {}, customHeaders = {}) {
  try {
    const res = await getApiClient().get(url, {
      params,
      headers: getDefaultHeaders(customHeaders),
    });
    return res.data;
  } catch (e) {
    throw handleApiError(e);
  }
}

export async function apiGetById(url, id, customHeaders = {}) {
  try {
    const res = await getApiClient().get(`${url}/${id}`, {
      headers: getDefaultHeaders(customHeaders),
    });
    return res.data;
  } catch (e) {
    throw handleApiError(e);
  }
}

export async function apiPost(url, data, customHeaders = {}) {
  try {
    const res = await getApiClient().post(url, data, {
      headers: getDefaultHeaders(customHeaders),
    });
    return res.data;
  } catch (e) {
    throw handleApiError(e);
  }
}

export async function apiPut(url, id, data, customHeaders = {}) {
  try {
    const res = await getApiClient().put(`${url}/${id}`, data, {
      headers: getDefaultHeaders(customHeaders),
    });
    return res.data;
  } catch (e) {
    throw handleApiError(e);
  }
}

export async function apiPatch(url, id, data, customHeaders = {}) {
  try {
    const res = await getApiClient().patch(`${url}/${id}`, data, {
      headers: getDefaultHeaders(customHeaders),
    });
    return res.data;
  } catch (e) {
    throw handleApiError(e);
  }
}

export async function apiDelete(url, id = null, customHeaders = {}) {
  try {
    const finalUrl = id ? `${url}/${id}` : url;
    const res = await getApiClient().delete(finalUrl, {
      headers: getDefaultHeaders(customHeaders),
    });
    return res.data;
  } catch (e) {
    throw handleApiError(e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Misc utilities (kept from original file)
// ─────────────────────────────────────────────────────────────────────────────
export function reloadPage() {
  setTimeout(() => window.location.reload(), 2000);
}

export function isStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!regex.test(password)) {
    return { valid: false, message: "Password must include uppercase, lowercase, number, and special character" };
  }
  return { valid: true, message: "Password is strong" };
}

export function getFileUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const isProd = import.meta.env.MODE === "production";
  const base = isProd
    ? import.meta.env.VITE_APP_BASE_URL_PRODUCTION?.replace("/api", "")
    : import.meta.env.VITE_API_URL || "http://localhost:5000";
  const clean = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${base}${clean}`;
}

export function hasPermission(permission) {
  try {
    const stored = localStorage.getItem("permissions");
    if (!stored) return false;
    let perms = [];
    try { perms = JSON.parse(stored); } catch { perms = stored.split(",").map(p => p.trim()); }
    return perms.includes(permission);
  } catch { return false; }
}

export function hasRole(role) {
  try {
    const stored = localStorage.getItem("roles");
    if (!stored) return false;
    let roles = [];
    try { roles = JSON.parse(stored); } catch { roles = stored.split(",").map(r => r.trim()); }
    return roles.includes(role);
  } catch { return false; }
}

export function validateField(formName, fieldName, value, formSchema) {
  const fieldSchema = formSchema[formName]?.fields[fieldName];
  if (!fieldSchema) return { valid: true, message: "" };

  if (fieldSchema.rules.required && !value)
    return { valid: false, message: `${fieldName} is required` };
  if (fieldSchema.rules.minLength && value.length < fieldSchema.rules.minLength)
    return { valid: false, message: `${fieldName} must be at least ${fieldSchema.rules.minLength} characters` };
  if (fieldSchema.rules.maxLength && value.length > fieldSchema.rules.maxLength)
    return { valid: false, message: `${fieldName} cannot exceed ${fieldSchema.rules.maxLength} characters` };
  if (fieldSchema.rules.pattern && !fieldSchema.rules.pattern.test(value))
    return { valid: false, message: `Please enter a valid ${fieldName}` };
  if (fieldSchema.rules.match && value !== fieldSchema.rules.match)
    return { valid: false, message: `${fieldName} must match the password` };

  return { valid: true, message: "" };
}

export function gregorianToEthiopian(today) {
  const GREGORIAN_NEW_YEAR = new Date(today.getFullYear(), 8, 11);
  let ethiopianYear = today.getFullYear() - 8;
  if (today < GREGORIAN_NEW_YEAR) ethiopianYear -= 1;
  const ethiopianNewYear = new Date(ethiopianYear + 8, 8, 11);
  const days = Math.floor((today - ethiopianNewYear) / 86400000);
  let month = Math.floor(days / 30) + 1;
  let day   = (days % 30) + 1;
  if (month > 13) { month = 13; day = days - 360 + 1; }
  return `${ethiopianYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPdfBlobUrl(base64Data) {
  const binary = atob(base64Data);
  const buf = new ArrayBuffer(binary.length);
  const u8  = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
}

export function base64ToFile(base64, fileName, mimeType) {
  const bytes = atob(base64);
  const buf   = new ArrayBuffer(bytes.length);
  const u8    = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i);
  return new File([new Blob([buf], { type: mimeType })], fileName, { type: mimeType });
}

export function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result);
    reader.onerror = e  => reject(e);
  });
}

export function processFilesToAdd(fileList) {
  return new Promise(resolve => {
    const out = [];
    if (!fileList.length) return resolve(out);
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        out.push({
          filename: file.name, fileType: file.type, size: file.size,
          description: "", fileData: reader.result.split(",")[1],
          preview: reader.result.split(",")[1], uploadedDate: "Not Uploaded",
        });
        if (out.length === fileList.length) resolve(out);
      };
      reader.readAsDataURL(file);
    });
  });
}

export function triggerFileInput(ref) { if (ref?.click) ref.click(); }

export function handleFileInput(event, method, callback) {
  const files = method === "input"
    ? Array.from(event.target.files)
    : Array.from(event.dataTransfer.files);
  if (typeof callback === "function") callback(files);
}

export function toggleDragState(context, isDragging) { if (context) context.isDragging = isDragging; }

export function removeAttachment(filesArray, index) {
  if (Array.isArray(filesArray) && index >= 0 && index < filesArray.length) filesArray.splice(index, 1);
}

const userCache = {};
export async function getFullNameById(id) {
  if (!id) return "";
  if (userCache[id]) return userCache[id];
  try {
    const res = await apiGetById("/users", id);
    const name = res?.first_name ? `${res.first_name} ${res.last_name || ""}`.trim() : "";
    userCache[id] = name;
    return name;
  } catch {
    userCache[id] = "Unknown";
    return "Unknown";
  }
}
