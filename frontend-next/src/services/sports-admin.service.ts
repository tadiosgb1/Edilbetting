import { apiClient } from "@/services/api-client";

export type PlatformConfig = { id?: string | number; _id?: string; key: string; value: string; description: string; is_active: boolean };
export type Sport = { id?: string | number; _id?: string; code: string; slug: string; has_outrights: boolean; is_active: boolean; sort_order: number };
export type Competition = { id?: string | number; _id?: string; sport_id: string | number; country_id: string | number; name: string; short_name: string; slug: string; competition_type: string; scope: string; region_code: string | null; is_active: boolean; sort_order: number };
export type CountryOption = { id?: string | number; _id?: string; name: string; iso2: string; is_active: boolean };
type AnyRow = Record<string, unknown>;

function rows<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === "object") {
    const value = response as Record<string, unknown>;
    if ("id" in value || "_id" in value || "key" in value || "code" in value || "slug" in value) return [value as T];
    for (const key of ["data", "items", "results", "countries", "sports", "competitions", "configs", "country", "sport", "competition", "config"]) {
      if (Array.isArray(value[key])) return value[key] as T[];
      if (value[key] && typeof value[key] === "object") return rows<T>(value[key]);
    }
  }
  return [];
}
function one<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    const data = (response as {data: unknown}).data;
    if (Array.isArray(data)) return data[0] as T;
    if (data && typeof data === "object") return data as T;
  }
  return response as T;
}
const keyOf = (row: AnyRow) => String(row.id ?? row._id ?? row.key ?? row.code ?? row.slug ?? "");
export const sportsAdminService = {
  async configs(activeOnly = false) { const {data}=await apiClient.get(activeOnly ? "/platform-config/active" : "/platform-config"); return rows<PlatformConfig>(data); },
  async createConfig(payload: Partial<PlatformConfig>) { const {data}=await apiClient.post("/platform-config",payload); return one<PlatformConfig>(data); },
  async updateConfig(row: PlatformConfig,payload: Partial<PlatformConfig>) { const {data}=await apiClient.put(`/platform-config/${encodeURIComponent(keyOf(row))}`,payload); return one<PlatformConfig>(data); },
  async deleteConfig(row: PlatformConfig) { await apiClient.delete(`/platform-config/${encodeURIComponent(keyOf(row))}`); },
  async toggleConfig(row: PlatformConfig) { const {data}=await apiClient.post(`/platform-config/${encodeURIComponent(keyOf(row))}/toggle`); return one<PlatformConfig>(data); },
  async sports() { const {data}=await apiClient.get("/sports"); return rows<Sport>(data); },
  async activeSports() { const {data}=await apiClient.get("/sports"); return rows<Sport>(data).filter(sport=>sport.is_active); },
  async sportByCode(code: string) { const {data}=await apiClient.get(`/sports/by-code/${encodeURIComponent(code)}`); return one<Sport>(data); },
  async createSport(payload: Partial<Sport>) { const {data}=await apiClient.post("/sports",payload); return one<Sport>(data); },
  async updateSport(row: Sport,payload: Partial<Sport>) { const {data}=await apiClient.put(`/sports/${encodeURIComponent(keyOf(row))}`,payload); return one<Sport>(data); },
  async deleteSport(row: Sport) { await apiClient.delete(`/sports/${encodeURIComponent(keyOf(row))}`); },
  async countries() { const {data}=await apiClient.get("/countries/active"); return rows<CountryOption>(data); },
  async competitions(filters: {sportId?: string; countryId?: string; slug?: string} = {}) {
    let path = "/competitions";
    if (filters.slug) path = `/competitions/by-slug/${encodeURIComponent(filters.slug)}`;
    else if (filters.sportId && filters.countryId) path = `/competitions/countries-by-sport/${encodeURIComponent(filters.sportId)}`;
    else if (filters.countryId) path = `/competitions/by-country/${encodeURIComponent(filters.countryId)}`;
    else if (filters.sportId) path = `/competitions/countries-by-sport/${encodeURIComponent(filters.sportId)}`;
    const {data}=await apiClient.get(path); const result=rows<Competition>(data); return filters.sportId && filters.countryId ? result.filter(item=>String(item.sport_id)===filters.sportId) : result;
  },
  async createCompetition(payload: Partial<Competition>) { const {data}=await apiClient.post("/competitions",payload); return one<Competition>(data); },
  async updateCompetition(row: Competition,payload: Partial<Competition>) { const {data}=await apiClient.put(`/competitions/${encodeURIComponent(keyOf(row))}`,payload); return one<Competition>(data); },
  async deleteCompetition(row: Competition) { await apiClient.delete(`/competitions/${encodeURIComponent(keyOf(row))}`); },
};
