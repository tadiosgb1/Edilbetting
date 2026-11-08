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

type CountryResponse = Country | Country[] | {
  data?: Country | Country[];
  countries?: Country[];
  country?: Country;
};

function listFrom(response: CountryResponse): Country[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.countries) return response.countries;
  if (response.data) return [response.data];
  if (response.country) return [response.country];
  return [];
}

function oneFrom(response: CountryResponse): Country {
  if (Array.isArray(response)) return response[0];
  if (response.data && !Array.isArray(response.data)) return response.data;
  if (response.country) return response.country;
  return response as Country;
}

export const countryService = {
  async list(): Promise<Country[]> {
    const { data } = await apiClient.get<CountryResponse>("/countries");
    return listFrom(data);
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
