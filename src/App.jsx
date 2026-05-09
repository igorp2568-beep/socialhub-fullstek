import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Plus, List, CheckCircle, XCircle, Settings, Trash2, RefreshCw, Clock, Send, Image, Film, Bell, Check, X, AlertCircle, Loader2, Eye, Link, CalendarClock, Zap, BarChart3, User } from "lucide-react";

const SUPABASE_URL = "https://khngocwvmkfcqokwiahz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobmdvY3d2bWtmY3Fva3dpYWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkyNTE2NywiZXhwIjoyMDkzNTAxMTY3fQ.x7sa03oibnA_eBQ5Q_7AF81oPIiShwItmKFjR9ODPFk";

const api = {
  headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
  async getPosts() { const r = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`, { headers: this.headers }); return r.json(); },
  async createPost(data) { const r = await fetch(`${SUPABASE_URL}/rest/v1/posts`, { method: "POST", headers: this.headers, body: JSON.stringify(data) }); return r.json(); },
  async deletePost(id) { await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, { method: "DELETE", headers: this.headers }); },
};

const statusBadge = (s) => { const m = { pendente: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", Icon: Clock, label: "Pendente" }, publicado: { color: "#10b981", bg: "rgba(16,185,129,0.12)", Icon: CheckCircle, label: "Publicado" }, erro: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", Icon: XCircle, label: "Erro" } }; const c = m[s] || m.pendente; return <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:c.bg,color:c.color,fontSize:12,fontWeight:600 }}><c.Icon size={12} /> {c.label}</span>; };
const tipoBadge = (t) => <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,background:t==="REELS"?"rgba(139,92,246,0.15)":"rgba(59,130,246,0.15)",color:t==="REELS"?"#a78bfa":"#60a5fa",fontSize:11,fontWeight:700 }}>{t==="REELS"?<Film size={11}/>:<Image size={11}/>} {t}</span>;

function Dashboard({ posts, loading, onRefresh }) {
  const pend = posts.filter(p=>p.status==="pendente").length;
  const pub = posts.filter(p=>p.status==="publicado").length;
  const err = posts.filter(p=>p.status==="erro").length;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:28 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><h1 style={{ fontSize:24,fontWeight:800,color:"#f1f5f9",margin:0 }}>Dashboard</h1><p style={{ color:"#64748b",fontSize:14,margin:"4px 0 0" }}>Visao geral dos seus posts</p></div>
        <button onClick={onRefresh} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#94a3b8",cursor:"pointer",fontSize:13 }}><RefreshCw size={14} /> Atualizar</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
        {[{icon:List,label:"Total",value:posts.length,color:"#60a5fa"},{icon:Clock,label:"Pendentes",value:pend,color:"#f59e0b"},{icon:CheckCircle,label:"Publicados",value:pub,color:"#10b981"},{icon:XCircle,label:"Erros",value:err,color:"#ef4444"}].map(({icon:Icon,label,value,color})=>(
          <div key={label} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"20px 24px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:12 }}><span style={{ fontSize:13,color:"#64748b" }}>{label}</span><div style={{ background:`${color}20`,borderRadius:10,padding:8 }}><Icon size={16} style={{ color }} /></div></div>
            <div style={{ fontSize:32,fontWeight:800,color:"#f1f5f9",fontFamily:"monospace" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,overflow:"hidden" }}>
        <div style={{ padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between" }}><span style={{ fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Posts Recentes</span><span style={{ fontSize:12,color:"#475569" }}>{posts.length} total</span></div>
        {loading ? <div style={{ display:"flex",justifyContent:"center",padding:40 }}><Loader2 size={24} style={{ color:"#3b82f6",animation:"spin 1s linear infinite" }} /></div> :
         posts.length===0 ? <div style={{ textAlign:"center",padding:48,color:"#475569" }}><p>Nenhum post ainda</p></div> :
         <table style={{ width:"100%",borderCollapse:"collapse" }}>
           <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{["Midia","Legenda","Tipo","Contas","Status","Agendado"].map(h=><th key={h} style={{ padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
           <tbody>{posts.slice(0,8).map((p,i)=>{ let contas=[]; try{contas=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{} return (
             <tr key={p.id} style={{ borderBottom:i<7?"1px solid rgba(255,255,255,0.04)":"none" }}>
               <td style={{ padding:"12px 16px" }}><a href={p.url_midia} target="_blank" rel="noopener noreferrer" style={{ color:"#60a5fa",fontSize:12 }}>ver</a></td>
               <td style={{ padding:"12px 16px",color:"#94a3b8",fontSize:13,maxWidth:200 }}><span style={{ display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.legenda||"—"}</span></td>
               <td style={{ padding:"12px 16px" }}>{tipoBadge(p.tipo)}</td>
               <td style={{ padding:"12px 16px",color:"#64748b",fontSize:12 }}>{contas.map(c=>c.conta||c).join(", ")||"—"}</td>
               <td style={{ padding:"12px 16px" }}>{statusBadge(p.status)}</td>
               <td style={{ padding:"12px 16px",color:"#475569",fontSize:12 }}>{p.postar_agora?<span style={{color:"#f59e0b"}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</td>
             </tr>);})}</tbody>
         </table>}
      </div>
    </div>
  );
}

function NovoPost({ accounts, onSuccess, onToast }) {
  const [form, setForm] = useState({ url_midia:"",legenda:"",tipo:"IMAGE",postar_agora:true,data_agendada:"" });
  const [sel, setSel] = useState([]);
  const [loading, setLoading] = useState(false);
  const inp = { width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 14px",color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box" };
  const lbl = { fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:8,display:"block" };
  const submit = async () => {
    if (!form.url_midia) return onToast("URL obrigatoria","error");
    if (!sel.length) return onToast("Selecione uma conta","error");
    if (!form.postar_agora && !form.data_agendada) return onToast("Defina a data","error");
    setLoading(true);
    try {
      await api.createPost({ url_midia:form.url_midia,legenda:form.legenda,tipo:form.tipo,contas:JSON.stringify(sel),status:"pendente",postar_agora:form.postar_agora,data_agendada:form.postar_agora?null:new Date(form.data_agendada).toISOString() });
      onToast("Post criado!","success"); setForm({url_midia:"",legenda:"",tipo:"IMAGE",postar_agora:true,data_agendada:""}); setSel([]); onSuccess();
    } catch(e) { onToast("Erro: "+e.message,"error"); }
    setLoading(false);
  };
  return (
    <div style={{ maxWidth:680,display:"flex",flexDirection:"column",gap:24 }}>
      <div><h1 style={{ fontSize:24,fontWeight:800,color:"#f1f5f9",margin:0 }}>Novo Post</h1><p style={{ color:"#64748b",fontSize:14,margin:"4px 0 0" }}>Crie um post para publicacao automatica</p></div>
      <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24,display:"flex",flexDirection:"column",gap:20 }}>
        <div><label style={lbl}>URL da Midia *</label><input style={inp} placeholder="https://..." value={form.url_midia} onChange={e=>setForm(f=>({...f,url_midia:e.target.value}))} /></div>
        <div><label style={lbl}>Legenda</label><textarea style={{...inp,minHeight:100,resize:"vertical"}} placeholder="Legenda..." value={form.legenda} onChange={e=>setForm(f=>({...f,legenda:e.target.value}))} /></div>
        <div><label style={lbl}>Tipo</label>
          <div style={{ display:"flex",gap:10 }}>{[{v:"IMAGE",label:"Imagem"},{v:"REELS",label:"Reel"}].map(({v,label})=>(
            <button key={v} onClick={()=>setForm(f=>({...f,tipo:v}))} style={{ flex:1,padding:"11px 0",borderRadius:10,border:`1px solid ${form.tipo===v?"#3b82f6":"rgba(255,255,255,0.1)"}`,background:form.tipo===v?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",color:form.tipo===v?"#60a5fa":"#64748b",cursor:"pointer",fontWeight:600 }}>{label}</button>
          ))}</div>
        </div>
        <div><label style={lbl}>Contas *</label>
          {accounts.length===0 ? <div style={{ padding:16,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,color:"#f59e0b",fontSize:13 }}>Adicione contas nas Configuracoes.</div> :
           <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>{accounts.map(acc=>{ const s=sel.find(a=>a.conta===acc.conta); return <button key={acc.conta} onClick={()=>setSel(p=>s?p.filter(a=>a.conta!==acc.conta):[...p,acc])} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:20,border:`1px solid ${s?"#3b82f6":"rgba(255,255,255,0.1)"}`,background:s?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",color:s?"#60a5fa":"#64748b",cursor:"pointer",fontWeight:600 }}>{s&&<Check size={12}/>}@{acc.conta}</button>; })}</div>}
        </div>
        <div><label style={lbl}>Agendamento</label>
          <div style={{ display:"flex",gap:10,marginBottom:12 }}>{[{v:true,label:"Postar agora"},{v:false,label:"Agendar"}].map(({v,label})=>(
            <button key={String(v)} onClick={()=>setForm(f=>({...f,postar_agora:v}))} style={{ flex:1,padding:"11px 0",borderRadius:10,border:`1px solid ${form.postar_agora===v?"#3b82f6":"rgba(255,255,255,0.1)"}`,background:form.postar_agora===v?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",color:form.postar_agora===v?"#60a5fa":"#64748b",cursor:"pointer",fontWeight:600 }}>{label}</button>
          ))}</div>
          {!form.postar_agora && <input type="datetime-local" style={inp} value={form.data_agendada} onChange={e=>setForm(f=>({...f,data_agendada:e.target.value}))} />}
        </div>
        <button onClick={submit} disabled={loading} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px 0",borderRadius:12,background:loading?"rgba(59,130,246,0.4)":"linear-gradient(135deg,#3b82f6,#2563eb)",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer" }}>
          {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<Send size={16}/>}{loading?"Enviando...":"Criar Post"}
        </button>
      </div>
    </div>
  );
}

function Fila({ posts, loading, onRefresh, onDelete }) {
  const [filter, setFilter] = useState("todos");
  const filtered = filter==="todos"?posts:posts.filter(p=>p.status===filter);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><h1 style={{ fontSize:24,fontWeight:800,color:"#f1f5f9",margin:0 }}>Fila de Posts</h1><p style={{ color:"#64748b",fontSize:14,margin:"4px 0 0" }}>{filtered.length} posts</p></div>
        <button onClick={onRefresh} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#94a3b8",cursor:"pointer",fontSize:13 }}><RefreshCw size={14}/> Atualizar</button>
      </div>
      <div style={{ display:"flex",gap:8 }}>{["todos","pendente","publicado","erro"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 16px",borderRadius:20,border:`1px solid ${filter===f?"#3b82f6":"rgba(255,255,255,0.1)"}`,background:filter===f?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",color:filter===f?"#60a5fa":"#64748b",cursor:"pointer",fontSize:13,fontWeight:600,textTransform:"capitalize" }}>{f}</button>)}</div>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {loading?<div style={{ display:"flex",justifyContent:"center",padding:48 }}><Loader2 size={24} style={{ color:"#3b82f6",animation:"spin 1s linear infinite" }}/></div>:
         filtered.length===0?<div style={{ textAlign:"center",padding:48,color:"#475569",background:"rgba(255,255,255,0.02)",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)" }}><p>Nenhum post encontrado</p></div>:
         filtered.map(p=>{ let contas=[]; try{contas=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{} return (
           <div key={p.id} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:16 }}>
             <div style={{ flex:1,minWidth:0 }}>
               <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap" }}>{statusBadge(p.status)}{tipoBadge(p.tipo)}<span style={{ fontSize:12,color:"#475569",fontFamily:"monospace" }}>{contas.map(c=>"@"+(c.conta||c)).join(", ")}</span></div>
               <p style={{ margin:"0 0 6px",color:"#94a3b8",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.legenda||<span style={{color:"#334155",fontStyle:"italic"}}>sem legenda</span>}</p>
               <span style={{ fontSize:12,color:"#475569" }}>{p.postar_agora?<span style={{color:"#f59e0b"}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</span>
             </div>
             <div style={{ display:"flex",gap:8 }}>
               <a href={p.url_midia} target="_blank" rel="noopener noreferrer" style={{ padding:"7px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#64748b",display:"flex",alignItems:"center" }}><Eye size={14}/></a>
               <button onClick={()=>onDelete(p.id)} style={{ padding:"7px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center" }}><Trash2 size={14}/></button>
             </div>
           </div>);
         })}
      </div>
    </div>
  );
}

function SettingsPage({ accounts, setAccounts, onToast }) {
  const [form, setForm] = useState({ conta:"",token:"",ig_user_id:"" });
  const inp = { width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 14px",color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box" };
  const lbl = { fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:6,display:"block" };
  const add = () => { if(!form.conta||!form.token||!form.ig_user_id) return onToast("Preencha tudo","error"); const u=[...accounts,{...form}]; setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); setForm({conta:"",token:"",ig_user_id:""}); onToast("Conta adicionada!","success"); };
  const remove = (c) => { const u=accounts.filter(a=>a.conta!==c); setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); onToast("Removida","success"); };
  return (
    <div style={{ maxWidth:640,display:"flex",flexDirection:"column",gap:28 }}>
      <div><h1 style={{ fontSize:24,fontWeight:800,color:"#f1f5f9",margin:0 }}>Configuracoes</h1><p style={{ color:"#64748b",fontSize:14,margin:"4px 0 0" }}>Gerencie suas contas do Instagram</p></div>
      <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24 }}>
        <h2 style={{ fontSize:15,fontWeight:700,color:"#e2e8f0",margin:"0 0 20px" }}>Adicionar Conta</h2>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div><label style={lbl}>Nome (ex: doramas)</label><input style={inp} placeholder="doramas" value={form.conta} onChange={e=>setForm(f=>({...f,conta:e.target.value}))}/></div>
          <div><label style={lbl}>Access Token (Meta API)</label><input style={inp} placeholder="EAABm..." value={form.token} onChange={e=>setForm(f=>({...f,token:e.target.value}))} type="password"/></div>
          <div><label style={lbl}>Instagram User ID</label><input style={inp} placeholder="17841400..." value={form.ig_user_id} onChange={e=>setForm(f=>({...f,ig_user_id:e.target.value}))}/></div>
          <button onClick={add} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:10,background:"rgba(59,130,246,0.2)",border:"1px solid rgba(59,130,246,0.3)",color:"#60a5fa",cursor:"pointer",fontSize:14,fontWeight:700 }}><Plus size={15}/> Adicionar Conta</button>
        </div>
      </div>
      {accounts.length>0&&<div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,overflow:"hidden" }}>
        <div style={{ padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}><span style={{ fontSize:15,fontWeight:700,color:"#e2e8f0" }}>Contas Cadastradas</span></div>
        {accounts.map(acc=><div key={acc.conta} style={{ display:"flex",alignItems:"center",padding:"14px 24px",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ width:36,height:36,borderRadius:"50%",background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",marginRight:14 }}><User size={16} style={{color:"#60a5fa"}}/></div>
          <div style={{ flex:1 }}><div style={{ fontWeight:700,color:"#e2e8f0",fontSize:14 }}>@{acc.conta}</div><div style={{ fontSize:12,color:"#475569",fontFamily:"monospace" }}>ID: {acc.ig_user_id}</div></div>
          <button onClick={()=>remove(acc.conta)} style={{ padding:"6px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center" }}><Trash2 size={13}/></button>
        </div>)}
      </div>}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success:"#10b981",error:"#ef4444",info:"#3b82f6" };
  const icons = { success:Check,error:X,info:Bell };
  const Icon = icons[toast.type]||Bell;
  return <div style={{ position:"fixed",bottom:24,right:24,display:"flex",alignItems:"center",gap:10,padding:"12px 20px",background:"#1e293b",border:`1px solid ${colors[toast.type]}40`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",zIndex:1000,maxWidth:320 }}><Icon size={14} style={{color:colors[toast.type]}}/><span style={{ fontSize:14,color:"#e2e8f0",fontWeight:500 }}>{toast.message}</span></div>;
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [accounts, setAccounts] = useState(() => { try { return JSON.parse(localStorage.getItem("socialhub_accounts")||"[]"); } catch { return []; } });
  const showToast = useCallback((message,type="info") => { setToast({message,type}); setTimeout(()=>setToast(null),3500); },[]);
  const loadPosts = useCallback(async () => { setLoading(true); try { const d=await api.getPosts(); if(Array.isArray(d)) setPosts(d); } catch { showToast("Erro ao carregar","error"); } setLoading(false); },[showToast]);
  useEffect(() => { loadPosts(); },[loadPosts]);
  const handleDelete = async (id) => { if(!confirm("Deletar?")) return; await api.deletePost(id); setPosts(p=>p.filter(x=>x.id!==id)); showToast("Deletado","success"); };
  const nav = [{key:"dashboard",icon:LayoutDashboard,label:"Dashboard"},{key:"novo",icon:Plus,label:"Novo Post"},{key:"fila",icon:List,label:"Fila"},{key:"settings",icon:Settings,label:"Configuracoes"}];
  const pend = posts.filter(p=>p.status==="pendente").length;
  return (<>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0f1a;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}input,textarea,button{font-family:inherit}a{text-decoration:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}`}</style>
    <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
      <aside style={{ width:220,background:"rgba(255,255,255,0.02)",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0 }}>
        <div style={{ padding:"0 20px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize:18,fontWeight:900,color:"#f1f5f9" }}>Social<span style={{color:"#3b82f6"}}>Hub</span></div><div style={{ fontSize:11,color:"#334155",fontFamily:"monospace",marginTop:2 }}>Fullstek v1.0</div></div>
        <nav style={{ flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:4 }}>
          {nav.map(({key,icon:Icon,label})=>{ const a=page===key; return <button key={key} onClick={()=>setPage(key)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:a?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${a?"rgba(59,130,246,0.3)":"transparent"}`,color:a?"#60a5fa":"#64748b",cursor:"pointer",fontSize:14,fontWeight:a?700:500,textAlign:"left",width:"100%" }}><Icon size={16}/>{label}{key==="fila"&&pend>0&&<span style={{ marginLeft:"auto",background:"#f59e0b",color:"#000",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:800 }}>{pend}</span>}</button>; })}
        </nav>
        <div style={{ padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.06)" }}><div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.15)" }}><div style={{ width:7,height:7,borderRadius:"50%",background:"#10b981" }}/><span style={{ fontSize:12,color:"#10b981",fontWeight:600 }}>n8n ativo</span></div></div>
      </aside>
      <main style={{ flex:1,overflow:"auto",padding:32,background:"#0a0f1a" }}>
        {page==="dashboard"&&<Dashboard posts={posts} loading={loading} onRefresh={loadPosts}/>}
        {page==="novo"&&<NovoPost accounts={accounts} onSuccess={()=>{loadPosts();setPage("fila");}} onToast={showToast}/>}
        {page==="fila"&&<Fila posts={posts} loading={loading} onRefresh={loadPosts} onDelete={handleDelete}/>}
        {page==="settings"&&<SettingsPage accounts={accounts} setAccounts={setAccounts} onToast={showToast}/>}
      </main>
    </div>
    <Toast toast={toast}/>
  </>);
}
