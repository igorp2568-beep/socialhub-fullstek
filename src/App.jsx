import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Plus, List, CheckCircle, XCircle, Settings, Trash2, RefreshCw, Clock, Send, Image, Film, Bell, Check, X, AlertCircle, Loader2, Eye, Upload, User, LogOut, Zap, CalendarClock } from "lucide-react";

const SUPABASE_URL = "https://khngocwvmkfcqokwiahz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobmdvY3d2bWtmY3Fva3dpYWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkyNTE2NywiZXhwIjoyMDkzNTAxMTY3fQ.x7sa03oibnA_eBQ5Q_7AF81oPIiShwItmKFjR9ODPFk";

const neu = {
  flat: { background:"#12192b", boxShadow:"8px 8px 16px #090d16,-4px -4px 12px rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:24 },
  inset: { background:"#12192b", boxShadow:"inset 4px 4px 8px #090d16,inset -2px -2px 6px rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.02)", borderRadius:12 },
  btn: { background:"#12192b", boxShadow:"4px 4px 8px #090d16,-2px -2px 6px rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, cursor:"pointer", transition:"all 0.2s" },
  primary: { background:"#adc6ff", boxShadow:"4px 4px 12px rgba(0,0,0,0.3),inset 1px 1px 2px rgba(255,255,255,0.4)", color:"#002e6a", borderRadius:16, border:"none", cursor:"pointer", fontWeight:700, transition:"all 0.2s" },
  active: { background:"#12192b", boxShadow:"inset 4px 4px 8px #090d16,inset -2px -2px 6px rgba(255,255,255,0.02)", border:"1px solid rgba(173,198,255,0.2)", borderRadius:12 },
};

const api = {
  h: { "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}`, "Content-Type":"application/json", "Prefer":"return=representation" },
  async getPosts() { const r = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`,{headers:this.h}); return r.json(); },
  async createPost(d) { const r = await fetch(`${SUPABASE_URL}/rest/v1/posts`,{method:"POST",headers:this.h,body:JSON.stringify(d)}); return r.json(); },
  async deletePost(id) { await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`,{method:"DELETE",headers:this.h}); },
  async uploadFile(file) {
    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/posts/${name}`,{
      method:"POST",
      headers:{ "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}`, "Content-Type":file.type, "x-upsert":"false" },
      body:file
    });
    if (!r.ok) throw new Error("Upload falhou");
    return `${SUPABASE_URL}/storage/v1/object/public/posts/${name}`;
  }
};

const C = { primary:"#adc6ff", secondary:"#4edea3", tertiary:"#ffb95f", error:"#ffb4ab", bg:"#12192b", onSurface:"#dae2fd", muted:"#8c909f" };

const statusBadge = (s) => {
  const m = { pendente:{c:C.tertiary,label:"Pendente",Icon:Clock}, publicado:{c:C.secondary,label:"Publicado",Icon:CheckCircle}, erro:{c:C.error,label:"Erro",Icon:XCircle} };
  const x = m[s]||m.pendente;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:`${x.c}18`,color:x.c,fontSize:11,fontWeight:600 }}><x.Icon size={11}/>{x.label}</span>;
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{ ...neu.flat, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <span style={{ fontSize:11,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em" }}>{label}</span>
        <div style={{ ...neu.inset, padding:8 }}><Icon size={18} style={{color}} /></div>
      </div>
      <div>
        <span style={{ fontSize:40,fontWeight:700,color,lineHeight:1 }}>{value}</span>
        {sub && <p style={{ fontSize:12,color:C.muted,marginTop:4 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Dashboard({ posts, loading, onRefresh, onNav }) {
  const pend = posts.filter(p=>p.status==="pendente").length;
  const pub = posts.filter(p=>p.status==="publicado").length;
  const err = posts.filter(p=>p.status==="erro").length;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:32 }}>
      <div>
        <h2 style={{ fontSize:32,fontWeight:600,color:C.onSurface,margin:0,letterSpacing:"-0.02em" }}>Dashboard</h2>
        <p style={{ color:C.muted,fontSize:14,margin:"6px 0 0" }}>Visao geral dos seus posts.</p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:24 }}>
        <StatCard icon={List} label="Total" value={posts.length} color={C.primary} />
        <StatCard icon={Clock} label="Pendentes" value={pend} color={C.tertiary} sub="aguardando n8n" />
        <StatCard icon={CheckCircle} label="Publicados" value={pub} color={C.secondary} />
        <StatCard icon={XCircle} label="Erros" value={err} color={C.error} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:24 }}>
        <div style={{ ...neu.flat, overflow:"hidden" }}>
          <div style={{ padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:18,fontWeight:600,color:C.onSurface }}>Posts Recentes</span>
            <button onClick={onRefresh} style={{ ...neu.btn,display:"flex",alignItems:"center",gap:6,padding:"8px 14px",color:C.muted,fontSize:13 }}><RefreshCw size={13}/> Atualizar</button>
          </div>
          {loading ? <div style={{ display:"flex",justifyContent:"center",padding:48 }}><Loader2 size={28} style={{ color:C.primary,animation:"spin 1s linear infinite" }}/></div> :
           posts.length===0 ? (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"64px 32px",gap:20 }}>
              <div style={{ ...neu.inset,width:80,height:80,borderRadius:24,display:"flex",alignItems:"center",justifyContent:"center" }}><Plus size={36} style={{color:C.muted,opacity:0.5}}/></div>
              <div style={{ textAlign:"center" }}><h4 style={{ color:C.onSurface,fontWeight:600,margin:"0 0 8px" }}>Sem atividade ainda</h4><p style={{ color:C.muted,fontSize:14,maxWidth:280 }}>Comece agendando seus conteudos.</p></div>
              <button onClick={()=>onNav("novo")} style={{ ...neu.primary,padding:"12px 28px",fontSize:14 }}>Criar Primeiro Post</button>
            </div>
           ) : (
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>{["Midia","Legenda","Tipo","Contas","Status","Quando"].map(h=><th key={h} style={{ padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>{posts.slice(0,8).map((p,i)=>{ let c=[]; try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{} return (
                <tr key={p.id} style={{ borderBottom:i<7?"1px solid rgba(255,255,255,0.04)":"none" }}>
                  <td style={{ padding:"12px 16px" }}><a href={p.url_midia} target="_blank" rel="noopener noreferrer" style={{ color:C.primary,fontSize:12 }}>ver</a></td>
                  <td style={{ padding:"12px 16px",color:C.muted,fontSize:13,maxWidth:160 }}><span style={{ display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.legenda||"—"}</span></td>
                  <td style={{ padding:"12px 16px" }}><span style={{ fontSize:11,fontWeight:700,color:p.tipo==="REELS"?"#a78bfa":C.primary }}>{p.tipo}</span></td>
                  <td style={{ padding:"12px 16px",color:C.muted,fontSize:12 }}>{c.map(x=>x.conta||x).join(", ")||"—"}</td>
                  <td style={{ padding:"12px 16px" }}>{statusBadge(p.status)}</td>
                  <td style={{ padding:"12px 16px",color:C.muted,fontSize:12 }}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</td>
                </tr>);})}</tbody>
            </table>
           )}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
          <div style={{ ...neu.flat,padding:24 }}>
            <h4 style={{ color:C.primary,fontWeight:600,margin:"0 0 12px" }}>Dica Pro</h4>
            <p style={{ color:C.muted,fontSize:14,lineHeight:1.6 }}>Mantenha seu n8n ativo para garantir que os posts sejam publicados nos horarios programados.</p>
          </div>
          <div style={{ ...neu.flat,padding:24 }}>
            <h4 style={{ color:C.onSurface,fontWeight:600,margin:"0 0 16px" }}>Resumo</h4>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {[{label:"Taxa de sucesso",value:posts.length>0?`${Math.round((pub/posts.length)*100)}%`:"—",color:C.secondary},{label:"Aguardando",value:pend,color:C.tertiary},{label:"Esta semana",value:posts.filter(p=>{const d=new Date(p.created_at);return(new Date()-d)<7*86400000;}).length,color:C.primary}].map(({label,value,color})=>(
                <div key={label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:13,color:C.muted }}>{label}</span>
                  <span style={{ fontSize:16,fontWeight:700,color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function FileDropzone({ onFile, file, uploading }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const handle = (f) => { if(f&&(f.type.startsWith("image/")||f.type.startsWith("video/"))) onFile(f); };
  return (
    <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}}
      style={{ ...neu.inset,padding:32,textAlign:"center",cursor:"pointer",borderRadius:20,border:drag?`2px dashed ${C.primary}`:"2px dashed rgba(255,255,255,0.08)",transition:"all 0.2s" }}>
      <input ref={ref} type="file" accept="image/*,video/*" style={{ display:"none" }} onChange={e=>handle(e.target.files[0])} />
      {uploading ? (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
          <Loader2 size={32} style={{ color:C.primary,animation:"spin 1s linear infinite" }}/>
          <span style={{ color:C.muted,fontSize:14 }}>Enviando para o Supabase...</span>
        </div>
      ) : file ? (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
          {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} style={{ width:120,height:120,objectFit:"cover",borderRadius:16 }} alt="preview"/> : <div style={{ width:120,height:120,borderRadius:16,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}><Film size={40} style={{color:"#a78bfa"}}/></div>}
          <span style={{ color:C.secondary,fontSize:13,fontWeight:600 }}>{file.name}</span>
          <span style={{ color:C.muted,fontSize:12 }}>Clique para trocar</span>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
          <div style={{ ...neu.flat,width:64,height:64,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto" }}><Upload size={28} style={{color:C.muted}}/></div>
          <div><p style={{ color:C.onSurface,fontWeight:600,margin:"0 0 4px" }}>Arraste ou clique para enviar</p><p style={{ color:C.muted,fontSize:13 }}>Imagens e videos (JPG, PNG, MP4)</p></div>
        </div>
      )}
    </div>
  );
}

function AccountSelector({ accounts, selected, onChange, onNav }) {
  if (accounts.length===0) return (
    <div style={{ ...neu.inset,padding:20,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
      <span style={{ color:C.tertiary,fontSize:13 }}>Nenhuma conta cadastrada</span>
      <button onClick={()=>onNav("settings")} style={{ ...neu.primary,padding:"8px 16px",fontSize:12 }}>+ Adicionar</button>
    </div>
  );
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:12 }}>
      {accounts.map(acc => {
        const sel = selected.find(a=>a.conta===acc.conta);
        return (
          <button key={acc.conta} onClick={()=>onChange(p=>sel?p.filter(a=>a.conta!==acc.conta):[...p,acc])}
            style={{ ...(sel?neu.active:neu.btn),padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,position:"relative" }}>
            {sel && <div style={{ position:"absolute",top:8,right:8,width:18,height:18,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center" }}><Check size={10} style={{color:"#002e6a"}}/></div>}
            <div style={{ width:40,height:40,borderRadius:"50%",background:sel?`${C.primary}20`:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",border:sel?`2px solid ${C.primary}`:"2px solid transparent" }}>
              <User size={18} style={{color:sel?C.primary:C.muted}}/>
            </div>
            <span style={{ fontSize:12,fontWeight:sel?700:500,color:sel?C.primary:C.muted }}>@{acc.conta}</span>
          </button>
        );
      })}
    </div>
  );
}

function NovoPost({ accounts, onSuccess, onToast, onNav }) {
  const [form, setForm] = useState({ legenda:"",tipo:"IMAGE",postar_agora:true,data_agendada:"" });
  const [file, setFile] = useState(null);
  const [sel, setSel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lbl = { fontSize:13,fontWeight:600,color:C.muted,marginBottom:10,display:"block",textTransform:"uppercase",letterSpacing:"0.05em" };
  const inp = { ...neu.inset,width:"100%",padding:"12px 16px",color:C.onSurface,fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b" };
  const submit = async () => {
    if (!file) return onToast("Selecione uma midia","error");
    if (!sel.length) return onToast("Selecione uma conta","error");
    if (!form.postar_agora && !form.data_agendada) return onToast("Defina a data","error");
    setLoading(true);
    try {
      setUploading(true);
      const url = await api.uploadFile(file);
      setUploading(false);
      await api.createPost({ url_midia:url,legenda:form.legenda,tipo:form.tipo,contas:JSON.stringify(sel),status:"pendente",postar_agora:form.postar_agora,data_agendada:form.postar_agora?null:new Date(form.data_agendada).toISOString() });
      onToast("Post criado com sucesso!","success");
      setForm({legenda:"",tipo:"IMAGE",postar_agora:true,data_agendada:""});
      setFile(null); setSel([]);
      onSuccess();
    } catch(e) { setUploading(false); onToast("Erro: "+e.message,"error"); }
    setLoading(false);
  };
  return (
    <div style={{ maxWidth:680,display:"flex",flexDirection:"column",gap:28 }}>
      <div><h2 style={{ fontSize:32,fontWeight:600,color:C.onSurface,margin:0 }}>Novo Post</h2><p style={{ color:C.muted,fontSize:14,margin:"6px 0 0" }}>Crie um post para publicacao automatica</p></div>
      <div style={{ ...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:24 }}>
        <div><label style={lbl}>Midia *</label><FileDropzone onFile={setFile} file={file} uploading={uploading}/></div>
        <div><label style={lbl}>Tipo</label>
          <div style={{ display:"flex",gap:12 }}>{[{v:"IMAGE",label:"Imagem"},{v:"REELS",label:"Reel"}].map(({v,label})=>(
            <button key={v} onClick={()=>setForm(f=>({...f,tipo:v}))} style={{ ...(form.tipo===v?neu.active:neu.btn),flex:1,padding:"12px 0",color:form.tipo===v?C.primary:C.muted,fontWeight:form.tipo===v?700:500,fontSize:14 }}>{label}</button>
          ))}</div>
        </div>
        <div><label style={lbl}>Legenda</label><textarea style={{ ...inp,minHeight:100,resize:"vertical" }} placeholder="Legenda do post..." value={form.legenda} onChange={e=>setForm(f=>({...f,legenda:e.target.value}))}/></div>
        <div><label style={lbl}>Contas *</label><AccountSelector accounts={accounts} selected={sel} onChange={setSel} onNav={onNav}/></div>
        <div><label style={lbl}>Agendamento</label>
          <div style={{ display:"flex",gap:12,marginBottom:12 }}>{[{v:true,label:"Postar agora"},{v:false,label:"Agendar"}].map(({v,label})=>(
            <button key={String(v)} onClick={()=>setForm(f=>({...f,postar_agora:v}))} style={{ ...(form.postar_agora===v?neu.active:neu.btn),flex:1,padding:"12px 0",color:form.postar_agora===v?C.primary:C.muted,fontWeight:form.postar_agora===v?700:500,fontSize:14 }}>{label}</button>
          ))}</div>
          {!form.postar_agora && <input type="datetime-local" style={inp} value={form.data_agendada} onChange={e=>setForm(f=>({...f,data_agendada:e.target.value}))}/>}
        </div>
        <button onClick={submit} disabled={loading} style={{ ...neu.primary,padding:"15px 0",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?0.7:1 }}>
          {loading?<Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/>:<Send size={18}/>}{loading?(uploading?"Enviando arquivo...":"Criando post..."):"Publicar Post"}
        </button>
      </div>
    </div>
  );
}
function Fila({ posts, loading, onRefresh, onDelete }) {
  const [filter, setFilter] = useState("todos");
  const filtered = filter==="todos"?posts:posts.filter(p=>p.status===filter);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:28 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><h2 style={{ fontSize:32,fontWeight:600,color:C.onSurface,margin:0 }}>Fila de Posts</h2><p style={{ color:C.muted,fontSize:14,margin:"6px 0 0" }}>{filtered.length} posts</p></div>
        <button onClick={onRefresh} style={{ ...neu.btn,display:"flex",alignItems:"center",gap:8,padding:"10px 18px",color:C.muted,fontSize:13 }}><RefreshCw size={14}/> Atualizar</button>
      </div>
      <div style={{ display:"flex",gap:10 }}>{["todos","pendente","publicado","erro"].map(f=>(
        <button key={f} onClick={()=>setFilter(f)} style={{ ...(filter===f?neu.active:neu.btn),padding:"8px 18px",color:filter===f?C.primary:C.muted,fontSize:13,fontWeight:filter===f?700:500,textTransform:"capitalize" }}>{f}</button>
      ))}</div>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {loading?<div style={{ display:"flex",justifyContent:"center",padding:48 }}><Loader2 size={28} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:
         filtered.length===0?<div style={{ ...neu.flat,textAlign:"center",padding:48,color:C.muted }}><p>Nenhum post encontrado</p></div>:
         filtered.map(p=>{ let c=[]; try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{} return (
           <div key={p.id} style={{ ...neu.flat,padding:"18px 22px",display:"flex",alignItems:"center",gap:16 }}>
             <div style={{ flex:1,minWidth:0 }}>
               <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap" }}>
                 {statusBadge(p.status)}
                 <span style={{ fontSize:11,fontWeight:700,color:p.tipo==="REELS"?"#a78bfa":C.primary,background:p.tipo==="REELS"?"rgba(167,139,250,0.12)":"rgba(173,198,255,0.12)",padding:"2px 8px",borderRadius:6 }}>{p.tipo}</span>
                 {c.map(x=><span key={x.conta||x} style={{ fontSize:12,color:C.muted,background:"rgba(255,255,255,0.04)",padding:"2px 8px",borderRadius:20 }}>@{x.conta||x}</span>)}
               </div>
               <p style={{ margin:"0 0 6px",color:C.onSurface,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.legenda||<span style={{color:C.muted,fontStyle:"italic"}}>sem legenda</span>}</p>
               <span style={{ fontSize:12,color:C.muted }}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</span>
             </div>
             <div style={{ display:"flex",gap:8 }}>
               <a href={p.url_midia} target="_blank" rel="noopener noreferrer" style={{ ...neu.btn,padding:"8px 12px",color:C.muted,display:"flex",alignItems:"center" }}><Eye size={15}/></a>
               <button onClick={()=>onDelete(p.id)} style={{ ...neu.btn,padding:"8px 12px",color:C.error,display:"flex",alignItems:"center" }}><Trash2 size={15}/></button>
             </div>
           </div>);
         })}
      </div>
    </div>
  );
}

function SettingsPage({ accounts, setAccounts, onToast }) {
  const [form, setForm] = useState({ conta:"",token:"",ig_user_id:"" });
  const inp = { ...neu.inset,width:"100%",padding:"12px 16px",color:"#dae2fd",fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b" };
  const lbl = { fontSize:13,fontWeight:600,color:C.muted,marginBottom:8,display:"block",textTransform:"uppercase",letterSpacing:"0.05em" };
  const add = () => { if(!form.conta||!form.token||!form.ig_user_id) return onToast("Preencha tudo","error"); const u=[...accounts,{...form}]; setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); setForm({conta:"",token:"",ig_user_id:""}); onToast("Conta adicionada!","success"); };
  const remove = (c) => { if(!confirm(`Remover @${c}?`)) return; const u=accounts.filter(a=>a.conta!==c); setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); onToast("Removida","success"); };
  return (
    <div style={{ maxWidth:640,display:"flex",flexDirection:"column",gap:28 }}>
      <div><h2 style={{ fontSize:32,fontWeight:600,color:C.onSurface,margin:0 }}>Configuracoes</h2><p style={{ color:C.muted,fontSize:14,margin:"6px 0 0" }}>Gerencie suas contas do Instagram</p></div>
      <div style={{ ...neu.flat,padding:28 }}>
        <h3 style={{ fontSize:18,fontWeight:600,color:C.onSurface,margin:"0 0 20px" }}>Adicionar Conta</h3>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div><label style={lbl}>Nome da Conta</label><input style={inp} placeholder="doramas" value={form.conta} onChange={e=>setForm(f=>({...f,conta:e.target.value}))}/></div>
          <div><label style={lbl}>Access Token (Meta API)</label><input style={inp} placeholder="EAABm..." value={form.token} onChange={e=>setForm(f=>({...f,token:e.target.value}))} type="password"/></div>
          <div><label style={lbl}>Instagram User ID</label><input style={inp} placeholder="17841400..." value={form.ig_user_id} onChange={e=>setForm(f=>({...f,ig_user_id:e.target.value}))}/></div>
          <button onClick={add} style={{ ...neu.primary,padding:"14px",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}><Plus size={16}/> Adicionar Conta</button>
        </div>
      </div>
      {accounts.length>0 && (
        <div style={{ ...neu.flat,overflow:"hidden" }}>
          <div style={{ padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}><span style={{ fontSize:18,fontWeight:600,color:C.onSurface }}>Contas Cadastradas</span></div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,padding:24 }}>
            {accounts.map(acc=>(
              <div key={acc.conta} style={{ ...neu.btn,padding:20,display:"flex",flexDirection:"column",alignItems:"center",gap:12,position:"relative" }}>
                <button onClick={()=>remove(acc.conta)} style={{ position:"absolute",top:8,right:8,background:"rgba(255,180,171,0.1)",border:"none",borderRadius:8,padding:6,color:C.error,cursor:"pointer",display:"flex" }}><X size={12}/></button>
                <div style={{ width:52,height:52,borderRadius:"50%",background:`${C.primary}20`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.primary}40` }}><User size={22} style={{color:C.primary}}/></div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontWeight:700,color:C.onSurface,fontSize:15 }}>@{acc.conta}</div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:4,fontFamily:"monospace" }}>{acc.ig_user_id.slice(0,12)}...</div>
                </div>
                <div style={{ width:"100%",padding:"6px 10px",background:"rgba(78,222,163,0.08)",borderRadius:8,textAlign:"center" }}>
                  <span style={{ fontSize:11,color:C.secondary,fontWeight:600 }}>Configurada</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success:C.secondary,error:C.error,info:C.primary };
  return (
    <div style={{ position:"fixed",bottom:28,right:28,display:"flex",alignItems:"center",gap:12,padding:"14px 22px",background:"#1a2235",border:`1px solid ${colors[toast.type]}40`,borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:1000,maxWidth:340 }}>
      <div style={{ width:28,height:28,borderRadius:"50%",background:`${colors[toast.type]}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        {toast.type==="success"?<Check size={13} style={{color:C.secondary}}/>:toast.type==="error"?<X size={13} style={{color:C.error}}/>:<Bell size={13} style={{color:C.primary}}/>}
      </div>
      <span style={{ fontSize:14,color:C.onSurface,fontWeight:500 }}>{toast.message}</span>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [accounts, setAccounts] = useState(()=>{ try{return JSON.parse(localStorage.getItem("socialhub_accounts")||"[]");}catch{return[];} });
  const showToast = useCallback((message,type="info")=>{ setToast({message,type}); setTimeout(()=>setToast(null),3500); },[]);
  const loadPosts = useCallback(async()=>{ setLoading(true); try{const d=await api.getPosts(); if(Array.isArray(d)) setPosts(d);}catch{showToast("Erro ao carregar","error");} setLoading(false); },[showToast]);
  useEffect(()=>{loadPosts();},[loadPosts]);
  const handleDelete = async(id)=>{ if(!confirm("Deletar este post?")) return; await api.deletePost(id); setPosts(p=>p.filter(x=>x.id!==id)); showToast("Post deletado","success"); };
  const pend = posts.filter(p=>p.status==="pendente").length;
  const nav = [{key:"dashboard",icon:LayoutDashboard,label:"Dashboard"},{key:"novo",icon:Plus,label:"Novo Post"},{key:"fila",icon:List,label:"Fila"},{key:"settings",icon:Settings,label:"Configuracoes"}];
  return (<>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#12192b;color:#dae2fd;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}input,textarea,button{font-family:inherit}a{text-decoration:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}`}</style>
    <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
      <aside style={{ width:256,background:"#0e1423",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",padding:"32px 0",flexShrink:0 }}>
        <div style={{ padding:"0 24px 28px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <h1 style={{ fontSize:26,fontWeight:700,color:C.primary,margin:0 }}>SocialHub</h1>
          <p style={{ fontSize:11,color:C.muted,marginTop:4,fontFamily:"monospace" }}>Fullstek v1.0</p>
        </div>
        <nav style={{ flex:1,padding:"20px 12px",display:"flex",flexDirection:"column",gap:6 }}>
          {nav.map(({key,icon:Icon,label})=>{ const a=page===key; return (
            <button key={key} onClick={()=>setPage(key)} style={{ ...(a?neu.active:{}),display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:a?"#12192b":"transparent",border:a?"1px solid rgba(173,198,255,0.2)":"1px solid transparent",color:a?C.primary:C.muted,cursor:"pointer",fontSize:14,fontWeight:a?700:400,textAlign:"left",width:"100%",transition:"all 0.15s" }}>
              <Icon size={18}/>{label}
              {key==="fila"&&pend>0&&<span style={{ marginLeft:"auto",background:C.tertiary,color:"#2a1700",borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:800 }}>{pend}</span>}
            </button>
          );})}        </nav>
        <div style={{ padding:"16px 16px 0" }}>
          <div style={{ ...neu.inset,display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:14 }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:C.secondary,boxShadow:`0 0 8px ${C.secondary}` }}/>
            <span style={{ fontSize:12,color:C.secondary,fontWeight:600 }}>n8n ativo</span>
          </div>
        </div>
      </aside>
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <header style={{ background:"rgba(18,25,43,0.8)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 32px",display:"flex",justifyContent:"flex-end",alignItems:"center",flexShrink:0 }}>
          <button onClick={loadPosts} style={{ ...neu.btn,display:"flex",alignItems:"center",gap:8,padding:"9px 18px",color:C.muted,fontSize:13 }}><RefreshCw size={14}/> Atualizar</button>
        </header>
        <main style={{ flex:1,overflow:"auto",padding:40,background:"#12192b" }}>
          {page==="dashboard"&&<Dashboard posts={posts} loading={loading} onRefresh={loadPosts} onNav={setPage}/>}
          {page==="novo"&&<NovoPost accounts={accounts} onSuccess={()=>{loadPosts();setPage("fila");}} onToast={showToast} onNav={setPage}/>}
          {page==="fila"&&<Fila posts={posts} loading={loading} onRefresh={loadPosts} onDelete={handleDelete}/>}
          {page==="settings"&&<SettingsPage accounts={accounts} setAccounts={setAccounts} onToast={showToast}/>}
        </main>
      </div>
    </div>
    <Toast toast={toast}/>
  </>);
}
