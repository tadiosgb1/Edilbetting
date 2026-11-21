"use client";
import {useState} from "react";
import {LoaderCircle} from "lucide-react";
import {createAgentLogin,createAgentProfile,extractCreatedUserId,type AgentUserInput} from "@/services/agent.service";
import {getApiErrorMessage} from "@/services/api-client";
const userBlank:AgentUserInput={first_name:"",last_name:"",email:"",phone_number:"",password:"",role_id:1};
const agentBlank={business_name:"",national_id_number:"",address:"",city:"",region:"",kyc_verified:false,initial_deposit_paid:0,notes:""};
export function AgentManagementPage(){
 const [user,setUser]=useState(userBlank);const [agent,setAgent]=useState(agentBlank);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 const field=(label:string,value:string|number,onChange:(v:string)=>void,type="text",required=true)=> <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span><input required={required} type={type} value={value} onChange={e=>onChange(e.target.value)} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></label>;
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setSuccess("");try{
  const created=await createAgentLogin(user);const id=extractCreatedUserId(created.data);
  if(!id)throw new Error("User was created but the response did not include its ID. Agent record was not submitted.");
  await createAgentProfile({...agent,agent_id:id,initial_deposit_paid:Number(agent.initial_deposit_paid)});
  setSuccess("Agent created successfully. User table ID linked: "+id);setUser(userBlank);setAgent(agentBlank);
 }catch(err){setError(getApiErrorMessage(err,"Creation failed. Check whether the login was created before retrying to prevent duplicates."));}finally{setBusy(false);}}
 return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Agent management</h1><p className="mt-1 text-sm dashboard-muted">Create login details first, then submit the agent business profile.</p></div>
 {error&&<p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}{success&&<p role="status" className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">{success}</p>}
 <form onSubmit={submit} className="space-y-5"><section className="dashboard-card space-y-4"><div><h2 className="font-semibold">User login details</h2><p className="text-xs dashboard-muted">POST /users</p></div><div className="grid gap-4 sm:grid-cols-2">
 {field("First name",user.first_name,v=>setUser(s=>({...s,first_name:v})))}{field("Last name",user.last_name,v=>setUser(s=>({...s,last_name:v})))}{field("Email",user.email,v=>setUser(s=>({...s,email:v})),"email")}{field("Phone number",user.phone_number,v=>setUser(s=>({...s,phone_number:v})))}{field("Password",user.password,v=>setUser(s=>({...s,password:v})),"password")}{field("Role ID",user.role_id,v=>setUser(s=>({...s,role_id:Number(v)})),"number")}
 </div></section>
 <section className="dashboard-card space-y-4"><div><h2 className="font-semibold">Agent profile</h2><p className="text-xs dashboard-muted">POST /agents (agent_id is the user table ID returned above)</p></div><div className="grid gap-4 sm:grid-cols-2">
 {field("Business name",agent.business_name,v=>setAgent(s=>({...s,business_name:v})))}
 {field("National ID number",agent.national_id_number,v=>setAgent(s=>({...s,national_id_number:v})))}
 {field("Address",agent.address,v=>setAgent(s=>({...s,address:v})))}
 {field("City",agent.city,v=>setAgent(s=>({...s,city:v})))}
 {field("Region",agent.region,v=>setAgent(s=>({...s,region:v})))}
 {field("Initial deposit paid",agent.initial_deposit_paid,v=>setAgent(s=>({...s,initial_deposit_paid:Number(v)})),"number")}
 <label className="flex items-center gap-2 rounded-xl border p-3 text-sm sm:col-span-2"><input type="checkbox" checked={agent.kyc_verified} onChange={e=>setAgent(s=>({...s,kyc_verified:e.target.checked}))}/> KYC verified</label>
 <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Notes</span><textarea rows={3} value={agent.notes} onChange={e=>setAgent(s=>({...s,notes:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></label>
 </div></section><div className="flex justify-end"><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy&&<LoaderCircle size={15} className="animate-spin"/>}{busy?"Creating…":"Create agent"}</button></div></form></div>;
}