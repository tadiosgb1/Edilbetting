import { apiClient } from "@/services/api-client";

export type Country = {
  id?: string | number;
  _id?: string | number;
  name: string;
  iso2: string;
  iso3: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CountryPayload = Pick<Country, "name" | "iso2" | "iso3" | "is_active">;

export type CountryPage = {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  data: Country[];
};

type CountryResponse = Country | Country[] | {
  status?: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  page_size?: number;
  data?: Country | Country[];
  countries?: Country[];
  country?: Country;
};

function listFrom(response: CountryResponse): Country[] {
  if (Array.isArray(response)) return response;
  if ("data" in response && Array.isArray(response.data)) return response.data;
  if ("countries" in response && response.countries) return response.countries;
  if ("data" in response && response.data) return [response.data];
  if ("country" in response && response.country) return [response.country];
  return "name" in response ? [response] : [];
}

function oneFrom(response: CountryResponse): Country {
  if (Array.isArray(response)) return response[0];
  if ("data" in response && response.data && !Array.isArray(response.data)) return response.data;
  if ("country" in response && response.country) return response.country;
  return response as Country;
}

function pageFrom(response: CountryResponse): CountryPage {
  const rows = listFrom(response);
  return {
    count: response.count ?? rows.length,
    total_pages: response.total_pages ?? 1,
    current_page: response.current_page ?? 1,
    next: response.next ?? null,
    previous: response.previous ?? null,
    page_size: response.page_size ?? rows.length,
    data: rows,
  };
}

export const countryService = {
  async page(pageSize = 10): Promise<CountryPage> {
    const { data } = await apiClient.get<CountryResponse>("/countries", {
      params: { page: 1, page_size: pageSize },
    });
    return pageFrom(data);
  },
  async pageFromUrl(url: string): Promise<CountryPage> {
    const { data } = await apiClient.get<CountryResponse>(url);
    return pageFrom(data);
  },
  async active(): Promise<Country[]> {
    const { data } = await apiClient.get<CountryResponse>("/countries/active");
    return listFrom(data);
  },
  async byIso2(iso2: string): Promise<Country> {
    const { data } = await apiClient.get<CountryResponse>(`/countries/by-iso2/${encodeURIComponent(iso2.toUpperCase())}`);
    return oneFrom(data);
  },
  async create(payload: CountryPayload): Promise<Country> {
    const { data } = await apiClient.post<CountryResponse>("/countries", payload);
    return oneFrom(data);
  },
  async update(country: Country, payload: CountryPayload): Promise<Country> {
    const key = country.id ?? country._id ?? country.iso2;
    const { data } = await apiClient.put<CountryResponse>(`/countries/${encodeURIComponent(String(key))}`, payload);
    return oneFrom(data);
  },
  async remove(country: Country): Promise<void> {
    const key = country.id ?? country._id ?? country.iso2;
    await apiClient.delete(`/countries/${encodeURIComponent(String(key))}`);
  },
};
