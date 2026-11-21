import {apiClient} from "@/services/api-client";
export type Bank={id:string;bank_name:string;bank_code:string;swift_code?:string;logo_url?:string|null;is_active:boolean};
export type BankInput={bank_name:string;bank_code:string;swift_code?:string;logo_url?:string|null;is_active:boolean};
export type AccountInput={agent_id:string;account_type:"BANK";bank_id:string;account_number:string;account_name:string;bank_branch:string;is_primary:boolean;daily_limit:number};
export type EmployeeInput={employee_user_id:number;agent_id:string;job_title:string;bank_id:string;account_number:string;account_name:string;bank_branch:string;can_approve_deposits:boolean;can_approve_withdrawals:boolean};
const rows=<T,>(data:unknown,key:string):T[]=>{if(Array.isArray(data))return data as T[];if(data&&typeof data==="object"){const d=data as Record<string,unknown>;if(Array.isArray(d.data))return d.data as T[];if(Array.isArray(d[key]))return d[key] as T[];}return [];};
export async function getBanks(){return rows<Bank>((await apiClient.get("/banks")).data,"banks");}
export const createBank=(p:BankInput)=>apiClient.post("/banks",p);
export const updateBank=(id:string,p:BankInput)=>apiClient.patch("/banks/"+encodeURIComponent(id),p);
export const deleteBank=(id:string)=>apiClient.delete("/banks/"+encodeURIComponent(id));
export async function listAgentAccounts(id:string){return rows<Record<string,unknown>>((await apiClient.get("/agent-accounts",{params:{agent_id:id}})).data,"accounts");}
export const createAgentAccount=(p:AccountInput)=>apiClient.post("/agent-accounts",p);
export async function listAgentEmployees(id:string){return rows<Record<string,unknown>>((await apiClient.get("/agent-employees",{params:{agent_id:id}})).data,"employees");}
export const createAgentEmployee=(p:EmployeeInput)=>apiClient.post("/agent-employees",p);
export function currentAgentId(){if(typeof window==="undefined")return "";try{const a=JSON.parse(localStorage.getItem("edilbet-auth")||"{}");const u=a?.state?.user;return String(u?.agent_id??u?.agentId??u?.id??"");}catch{return "";}}
