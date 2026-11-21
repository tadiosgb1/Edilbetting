import {apiClient} from "@/services/api-client";
export type AgentInput={agent_id:string|number;business_name:string;national_id_number:string;address:string;city:string;region:string;kyc_verified:boolean;initial_deposit_paid:number;notes?:string};
export type Agent={id?:string;agent_id:string|number;business_name:string;city?:string;region?:string;kyc_verified?:boolean;[key:string]:unknown};
const unwrap=(v:unknown):Agent[]=>Array.isArray(v)?v:v&&typeof v==="object"&&Array.isArray((v as any).data)?(v as any).data:[];
export async function listAgents(){return unwrap((await apiClient.get("/agents")).data);}
export const createAgent=(p:AgentInput)=>apiClient.post("/agents",p);
export const updateAgent=(id:string,p:Partial<AgentInput>)=>apiClient.patch("/agents/"+encodeURIComponent(id),p);
export const deleteAgent=(id:string)=>apiClient.delete("/agents/"+encodeURIComponent(id));
