import { apiClient } from "@/services/api-client";
export type AgentUserInput = { first_name:string; last_name:string; email:string; phone_number:string; password:string; role_id:number };
export type AgentProfileInput = { agent_id:number; business_name:string; national_id_number:string; address:string; city:string; region:string; kyc_verified:boolean; initial_deposit_paid:number; notes:string };
export async function createAgentLogin(payload:AgentUserInput){return apiClient.post("/users",payload);}
export async function createAgentProfile(payload:AgentProfileInput){return apiClient.post("/agents",payload);}
export function extractCreatedUserId(response:unknown):number {
 if(!response||typeof response!=="object")return NaN;
 const r=response as any; const candidates=[r.data?.user?.id,r.data?.user?.user_id,r.data?.user?.userId,r.data?.id,r.user?.id,r.user?.user_id,r.user?.userId,r.userId,r.user_id];
 const found=candidates.find((v:any)=>v!=null&&String(v).trim()!==""); const n=Number(found);return Number.isFinite(n)&&n>0?n:NaN;
}