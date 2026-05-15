import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Plus, List, CheckCircle, XCircle, Settings, Trash2, RefreshCw, Clock, Send, Image, Film, Bell, Check, X, Loader2, Eye, Upload, User, ChevronLeft, ChevronRight, Sparkles, Key, Webhook, Database, Hash, Zap, Calendar, AlertCircle, Globe } from "lucide-react";

const getConfig = () => { try { return JSON.parse(localStorage.getItem("sh_config")||"{}"); } catch { return {}; } };
const getAccounts = () => { try { return JSON.parse(localStorage.getItem("socialhub_accounts")||"[]"); } catch { return []; } };

const makeApi = () => {
  const cfg = getConfig();
  const URL = cfg.supabase_url || "https://khngocwvmkfcqokwiahz.supabase.co";
  const KEY = cfg.supabase_key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobmdvY3d2bWtmY3Fva3dpYWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkyNTE2NywiZXhwIjoyMDkzNTAxMTY3fQ.x7sa03oibnA_eBQ5Q_7AF81oPIiShwItmKFjR9ODPFk";
  const h = { "apikey":KEY,"Authorization":`Bearer ${KEY}`,"Content-Type":"application/json","Prefer":"return=representation" };
  return {
    async getPosts() { const r=await fetch(`${URL}/rest/v1/posts?select=*&order=created_at.desc`,{headers:h}); return r.json(); },
    async createPost(d) { const r=await fetch(`${URL}/rest/v1/posts`,{method:"POST",headers:h,body:JSON.stringify(d)}); return r.json(); },
    async deletePost(id) { await fetch(`${URL}/rest/v1/posts?id=eq.${id}`,{method:"DELETE",headers:h}); },
    async uploadFile(file) {
      const name=`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
      const r=await fetch(`${URL}/storage/v1/object/posts/${name}`,{method:"POST",headers:{"apikey":KEY,"Authorization":`Bearer ${KEY}`,"Content-Type":file.type,"x-upsert":"false"},body:file});
      if(!r.ok) throw new Error("Upload falhou - verifique o bucket posts no Supabase Storage");
      return `${URL}/storage/v1/object/public/posts/${name}`;
    }
  };
};

const detectMediaType = (file) => file.type.startsWith("video/") ? "REELS" : "IMAGE";

const aiGenerateCaption = async (context, cfg) => {
  if (!cfg.ai_key) throw new Error("Configure a API key de IA nas Configuracoes");
  const isAnthropic = cfg.ai_key.startsWith("sk-ant-");
  if (isAnthropic) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"x-api-key":cfg.ai_key,"anthropic-version":"2023-06-01","content-type":"application/json"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:400,messages:[{role:"user",content:`Gere uma legenda criativa para Instagram sobre: "${context}". Inclua emojis e hashtags. Responda APENAS com a legenda.`}]})
    });
    const d=await r.json(); return d.content?.[0]?.text || "Erro";
  } else {
    const model = cfg.ai_model || "meta-llama/llama-3.3-8b-instruct:free";
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:"POST",
      headers:{"Authorization":`Bearer ${cfg.ai_key}`,"Content-Type":"application/json","HTTP-Referer":"https://socialhub.app"},
      body:JSON.stringify({model,messages:[{role:"user",content:`Gere uma legenda criativa para Instagram sobre: "${context}". Inclua emojis e hashtags relevantes. Responda APENAS com a legenda.`}]})
    });
    const d=await r.json(); return d.choices?.[0]?.message?.content || "Erro ao gerar";
  }
};

const neu = {
  flat:{background:"#12192b",boxShadow:"8px 8px 16px #090d16,-4px -4px 12px rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:24},
  inset:{background:"#12192b",boxShadow:"inset 4px 4px 8px #090d16,inset -2px -2px 6px rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.02)",borderRadius:12},
  btn:{background:"#12192b",boxShadow:"4px 4px 8px #090d16,-2px -2px 6px rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,cursor:"pointer",transition:"all 0.2s"},
  primary:{background:"#adc6ff",boxShadow:"4px 4px 12px rgba(0,0,0,0.3),inset 1px 1px 2px rgba(255,255,255,0.4)",color:"#002e6a",borderRadius:16,border:"none",cursor:"pointer",fontWeight:700,transition:"all 0.2s"},
  active:{background:"#12192b",boxShadow:"inset 4px 4px 8px #090d16,inset -2px -2px 6px rgba(255,255,255,0.02)",border:"1px solid rgba(173,198,255,0.2)",borderRadius:12},
};
const C={primary:"#adc6ff",secondary:"#4edea3",tertiary:"#ffb95f",error:"#ffb4ab",bg:"#12192b",onSurface:"#dae2fd",muted:"#8c909f"};
const AVATAR_COLORS=["#adc6ff","#4edea3","#ffb95f","#c084fc","#f472b6","#60a5fa","#34d399","#fb923c"];

const statusBadge=(s)=>{const m={pendente:{c:C.tertiary,label:"Pendente",I:Clock},publicado:{c:C.secondary,label:"Publicado",I:CheckCircle},erro:{c:C.error,label:"Erro",I:XCircle}};const x=m[s]||m.pendente;return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:`${x.c}18`,color:x.c,fontSize:11,fontWeight:600}}><x.I size={11}/>{x.label}</span>;};

function MiniCalendar({ selectedDate, onChange, posts=[] }) {
  const [view, setView] = useState(() => { const d=selectedDate?new Date(selectedDate):new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });
  const today = new Date();
  const daysInMonth = new Date(view.y, view.m+1, 0).getDate();
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const monthNames=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const scheduledDays = new Set(posts.filter(p=>p.data_agendada).map(p=>{ const d=new Date(p.data_agendada); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
  const sel = selectedDate ? new Date(selectedDate) : null;
  const pick = (day) => {
    const d = new Date(view.y, view.m, day);
    const existing = sel ? `T${String(sel.getHours()).padStart(2,"0")}:${String(sel.getMinutes()).padStart(2,"0")}` : "T10:00";
    onChange(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}${existing}`);
  };
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let i=1;i<=daysInMonth;i++) cells.push(i);
  return (
    <div style={{...neu.inset,borderRadius:20,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{y:v.y,m:v.m-1})} style={{...neu.btn,padding:"6px 10px",color:C.muted}}><ChevronLeft size={14}/></button>
        <span style={{fontSize:14,fontWeight:700,color:C.onSurface}}>{monthNames[view.m]} {view.y}</span>
        <button onClick={()=>setView(v=>v.m===11?{y:v.y+1,m:0}:{y:v.y,m:v.m+1})} style={{...neu.btn,padding:"6px 10px",color:C.muted}}><ChevronRight size={14}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
        {["D","S","T","Q","Q","S","S"].map((d,i)=><span key={i} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:600,padding:"4px 0"}}>{d}</span>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>;
          const isToday=today.getFullYear()===view.y&&today.getMonth()===view.m&&today.getDate()===day;
          const isSel=sel&&sel.getFullYear()===view.y&&sel.getMonth()===view.m&&sel.getDate()===day;
          const hasPost=scheduledDays.has(`${view.y}-${view.m}-${day}`);
          return (
            <button key={i} onClick={()=>pick(day)} style={{padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:isSel||isToday?700:400,background:isSel?"#adc6ff":isToday?"rgba(173,198,255,0.15)":"transparent",color:isSel?"#002e6a":isToday?C.primary:C.muted,position:"relative",transition:"all 0.15s"}}>
              {day}
              {hasPost&&!isSel&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:C.secondary}}/>}
            </button>
          );
        })}
      </div>
      {sel && (
        <div style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
          <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Horario</label>
          <input type="time" value={`${String(sel.getHours()).padStart(2,"0")}:${String(sel.getMinutes()).padStart(2,"0")}`}
            onChange={e=>{const[h,m]=e.target.value.split(":");const d=new Date(sel);d.setHours(+h,+m);onChange(d.toISOString().slice(0,16));}}
            style={{...neu.inset,padding:"8px 12px",color:C.onSurface,fontSize:13,outline:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,background:"#12192b",fontFamily:"monospace",width:"100%"}}/>
        </div>
      )}
    </div>
  );
}

function FileDropzone({ onFile, file, uploading }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const handle = (f) => { if(f&&(f.type.startsWith("image/")||f.type.startsWith("video/"))) onFile(f); };
  const tipo = file ? detectMediaType(file) : null;
  return (
    <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}}
      style={{...neu.inset,padding:28,textAlign:"center",cursor:"pointer",borderRadius:20,border:drag?`2px dashed ${C.primary}`:"2px dashed rgba(255,255,255,0.08)",transition:"all 0.2s"}}>
      <input ref={ref} type="file" accept="image/*,video/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
      {uploading ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <Loader2 size={32} style={{color:C.primary,animation:"spin 1s linear infinite"}}/>
          <span style={{color:C.muted,fontSize:14}}>Enviando para Supabase Storage...</span>
        </div>
      ) : file ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} style={{width:110,height:110,objectFit:"cover",borderRadius:14}} alt="preview"/> : <div style={{width:110,height:110,borderRadius:14,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><Film size={36} style={{color:"#a78bfa"}}/><span style={{fontSize:11,color:"#a78bfa",fontWeight:700}}>VIDEO</span></div>}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,color:C.secondary,fontWeight:600}}>{file.name.slice(0,30)}{file.name.length>30?"...":""}</span>
            <span style={{background:tipo==="REELS"?"rgba(167,139,250,0.2)":"rgba(173,198,255,0.2)",color:tipo==="REELS"?"#a78bfa":C.primary,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{tipo==="REELS"?"REEL":"FOTO"} auto</span>
          </div>
          <span style={{color:C.muted,fontSize:12}}>Clique para trocar</span>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{...neu.flat,width:60,height:60,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><Upload size={26} style={{color:C.muted}}/></div>
          <p style={{color:C.onSurface,fontWeight:600,margin:0}}>Arraste ou clique para enviar</p>
          <p style={{color:C.muted,fontSize:12,margin:0}}>Fotos (JPG/PNG) e Videos (MP4) — tipo detectado automaticamente</p>
        </div>
      )}
    </div>
  );
}

function AICaptionGenerator({ onGenerate }) {
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const cfg = getConfig();
  const gen = async () => {
    if(!ctx.trim()) return;
    setLoading(true);
    try { const cap=await aiGenerateCaption(ctx,cfg); onGenerate(cap); }
    catch(e) { alert("Erro IA: "+e.message); }
    setLoading(false);
  };
  if(!cfg.ai_key) return (
    <div style={{...neu.inset,padding:12,borderRadius:12,display:"flex",alignItems:"center",gap:8,border:"1px solid rgba(245,158,11,0.2)"}}>
      <AlertCircle size={13} style={{color:C.tertiary,flexShrink:0}}/>
      <span style={{fontSize:12,color:C.muted}}>Configure API key em Configuracoes → IA para usar o gerador</span>
    </div>
  );
  return (
    <div style={{...neu.inset,borderRadius:14,padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
        <Sparkles size={13} style={{color:C.primary}}/>
        <span style={{fontSize:11,fontWeight:700,color:C.primary,textTransform:"uppercase",letterSpacing:"0.05em"}}>Gerador de Legenda com IA</span>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={ctx} onChange={e=>setCtx(e.target.value)} placeholder="Descreva o conteudo (ex: foto K-pop idol Seoul, paisagem Japao...)"
          style={{flex:1,...neu.inset,padding:"10px 12px",color:C.onSurface,fontSize:13,outline:"none",background:"#12192b",border:"1px solid rgba(255,255,255,0.08)"}}
          onKeyDown={e=>e.key==="Enter"&&gen()}/>
        <button onClick={gen} disabled={loading||!ctx.trim()} style={{...neu.primary,padding:"10px 14px",fontSize:13,display:"flex",alignItems:"center",gap:5,opacity:loading||!ctx.trim()?0.6:1}}>
          {loading?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Sparkles size={13}/>}Gerar
        </button>
      </div>
    </div>
  );
}

function AccountSelector({ accounts, selected, onChange }) {
  if(accounts.length===0) return (
    <div style={{...neu.inset,padding:14,borderRadius:12,textAlign:"center",color:C.muted,fontSize:13}}>
      Nenhuma conta. Adicione em <strong style={{color:C.primary}}>Configuracoes → Contas</strong>
    </div>
  );
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
      {accounts.map((acc,idx)=>{
        const s=selected.find(a=>a.conta===acc.conta);
        const color=AVATAR_COLORS[idx%AVATAR_COLORS.length];
        return (
          <button key={acc.conta} onClick={()=>onChange(p=>s?p.filter(a=>a.conta!==acc.conta):[...p,acc])}
            style={{...(s?neu.active:neu.btn),display:"flex",alignItems:"center",gap:8,padding:"8px 14px",position:"relative"}}>
            {s&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={9} style={{color:"#002e6a"}}/></div>}
            <div style={{width:28,height:28,borderRadius:"50%",background:`${color}25`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${s?color:"transparent"}`}}>
              <span style={{fontSize:11,fontWeight:800,color}}>{acc.conta[0].toUpperCase()}</span>
            </div>
            <span style={{fontSize:13,fontWeight:s?700:500,color:s?C.onSurface:C.muted}}>@{acc.conta}</span>
          </button>
        );
      })}
    </div>
  );
}

function NovoPost({ accounts, onSuccess, onToast }) {
  const [form, setForm] = useState({legenda:"",postar_agora:true,data_agendada:""});
  const [file, setFile] = useState(null);
  const [sel, setSel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const lbl={fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,display:"block",textTransform:"uppercase",letterSpacing:"0.06em"};
  const inp={...neu.inset,width:"100%",padding:"12px 14px",color:C.onSurface,fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b"};
  const cfg=getConfig();

  const submit = async() => {
    if(!file) return onToast("Selecione uma midia","error");
    if(!sel.length) return onToast("Selecione pelo menos uma conta","error");
    if(!form.postar_agora&&!form.data_agendada) return onToast("Defina a data de agendamento","error");
    const tags = cfg.default_hashtags ? "\n\n"+cfg.default_hashtags : "";
    setLoading(true);
    try {
      setUploading(true);
      const url=await makeApi().uploadFile(file);
      setUploading(false);
      const tipo=detectMediaType(file);
      await makeApi().createPost({url_midia:url,legenda:(form.legenda||"")+tags,tipo,contas:JSON.stringify(sel),status:"pendente",postar_agora:form.postar_agora,data_agendada:form.postar_agora?null:new Date(form.data_agendada).toISOString()});
      onToast("Post criado com sucesso!","success");
      setForm({legenda:"",postar_agora:true,data_agendada:""}); setFile(null); setSel([]); setShowCal(false);
      onSuccess();
    } catch(e){setUploading(false);onToast("Erro: "+e.message,"error");}
    setLoading(false);
  };

  return (
    <div style={{maxWidth:700,display:"flex",flexDirection:"column",gap:28}}>
      <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Novo Post</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>Crie e agende um post para publicacao automatica via n8n</p></div>
      <div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:22}}>
        <div><label style={lbl}>Midia *</label><FileDropzone onFile={setFile} file={file} uploading={uploading}/></div>
        <div>
          <label style={lbl}>Legenda</label>
          <AICaptionGenerator onGenerate={cap=>setForm(f=>({...f,legenda:cap}))}/>
          <textarea style={{...inp,minHeight:90,resize:"vertical",marginTop:8}} placeholder="Escreva ou gere com IA acima..." value={form.legenda} onChange={e=>setForm(f=>({...f,legenda:e.target.value}))}/>
          {cfg.default_hashtags&&<p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>+ Hashtags padrao serao adicionadas automaticamente</p>}
        </div>
        <div><label style={lbl}>Contas *</label><AccountSelector accounts={accounts} selected={sel} onChange={setSel}/></div>
        <div>
          <label style={lbl}>Agendamento</label>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            {[{v:true,label:"Postar agora"},{v:false,label:"Agendar data"}].map(({v,label})=>(
              <button key={String(v)} onClick={()=>{setForm(f=>({...f,postar_agora:v}));if(!v)setShowCal(true);else setShowCal(false);}} style={{...(form.postar_agora===v?neu.active:neu.btn),flex:1,padding:"11px 0",color:form.postar_agora===v?C.primary:C.muted,fontWeight:form.postar_agora===v?700:500,fontSize:14}}>{v?"⚡ "+label:"📅 "+label}</button>
            ))}
          </div>
          {!form.postar_agora&&(
            <div>
              {form.data_agendada&&(
                <div style={{...neu.inset,padding:"10px 14px",borderRadius:10,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.secondary,fontSize:13,fontWeight:600}}>📅 {new Date(form.data_agendada).toLocaleString("pt-BR")}</span>
                  <button onClick={()=>setShowCal(!showCal)} style={{...neu.btn,padding:"4px 10px",fontSize:12,color:C.muted}}>{showCal?"Fechar":"Editar"}</button>
                </div>
              )}
              {(!form.data_agendada||showCal)&&(
                <MiniCalendar selectedDate={form.data_agendada} onChange={d=>{setForm(f=>({...f,data_agendada:d}));setShowCal(false);}} posts={[]}/>
              )}
            </div>
          )}
        </div>
        <button onClick={submit} disabled={loading} style={{...neu.primary,padding:"14px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?0.7:1}}>
          {loading?<Loader2 size={17} style={{animation:"spin 1s linear infinite"}}/>:<Send size={17}/>}{loading?(uploading?"Enviando arquivo...":"Criando post..."):"Publicar Post"}
        </button>
      </div>
    </div>
  );
}

function Fila({ posts, loading, onRefresh, onDelete }) {
  const [filter, setFilter] = useState("todos");
  const filtered=filter==="todos"?posts:posts.filter(p=>p.status===filter);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Fila de Posts</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>{filtered.length} posts</p></div>
        <button onClick={onRefresh} style={{...neu.btn,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13}/> Atualizar</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {["todos","pendente","publicado","erro"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{...(filter===f?neu.active:neu.btn),padding:"7px 16px",color:filter===f?C.primary:C.muted,fontSize:13,fontWeight:filter===f?700:500,textTransform:"capitalize"}}>{f}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Loader2 size={28} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:
         filtered.length===0?<div style={{...neu.flat,textAlign:"center",padding:48,color:C.muted}}>Nenhum post encontrado</div>:
         filtered.map(p=>{let c=[];try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{}const tipo=p.tipo||"IMAGE";return(
           <div key={p.id} style={{...neu.flat,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
             <div style={{width:46,height:46,borderRadius:12,background:tipo==="REELS"?"rgba(167,139,250,0.15)":"rgba(173,198,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
               {tipo==="REELS"?<Film size={20} style={{color:"#a78bfa"}}/>:<Image size={20} style={{color:C.primary}}/>}
             </div>
             <div style={{flex:1,minWidth:0}}>
               <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                 {statusBadge(p.status)}
                 {c.map(x=><span key={x.conta||x} style={{fontSize:11,color:C.muted,background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:20}}>@{x.conta||x}</span>)}
               </div>
               <p style={{margin:"0 0 4px",color:C.onSurface,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.legenda||<span style={{color:C.muted,fontStyle:"italic"}}>sem legenda</span>}</p>
               <span style={{fontSize:11,color:C.muted}}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</span>
             </div>
             <div style={{display:"flex",gap:8}}>
               <a href={p.url_midia} target="_blank" rel="noopener noreferrer" style={{...neu.btn,padding:"7px 10px",color:C.muted,display:"flex",alignItems:"center"}}><Eye size={14}/></a>
               <button onClick={()=>onDelete(p.id)} style={{...neu.btn,padding:"7px 10px",color:C.error,display:"flex",alignItems:"center"}}><Trash2 size={14}/></button>
             </div>
           </div>);})}
      </div>
    </div>
  );
}

function SettingsPage({ accounts, setAccounts, onToast }) {
  const [tab, setTab] = useState("contas");
  const [cfg, setCfg] = useState(getConfig);
  const [form, setForm] = useState({conta:"",token:"",ig_user_id:""});
  const inp={...neu.inset,width:"100%",padding:"11px 14px",color:C.onSurface,fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b"};
  const lbl={fontSize:12,fontWeight:700,color:C.muted,marginBottom:7,display:"block",textTransform:"uppercase",letterSpacing:"0.06em"};
  const saveCfg = () => { localStorage.setItem("sh_config",JSON.stringify(cfg)); onToast("Configuracoes salvas!","success"); };
  const addAcc = () => { if(!form.conta||!form.token||!form.ig_user_id) return onToast("Preencha todos os campos","error"); const u=[...accounts,{...form}]; setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); setForm({conta:"",token:"",ig_user_id:""}); onToast("Conta adicionada!","success"); };
  const removeAcc = (c) => { if(!confirm(`Remover @${c}?`)) return; const u=accounts.filter(a=>a.conta!==c); setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); onToast("Conta removida","success"); };
  const MODELS=["meta-llama/llama-3.3-8b-instruct:free","meta-llama/llama-3.1-8b-instruct:free","google/gemini-2.0-flash-exp:free","claude-haiku-4-5-20251001","gpt-4o-mini"];
  const tabs=[{k:"contas",l:"Contas",I:User},{k:"integracoes",l:"Integracoes",I:Database},{k:"ia",l:"IA",I:Sparkles},{k:"geral",l:"Geral",I:Settings}];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:720}}>
      <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Configuracoes</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>Gerencie contas, integracoes e preferencias</p></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {tabs.map(({k,l,I})=>(
          <button key={k} onClick={()=>setTab(k)} style={{...(tab===k?neu.active:neu.btn),padding:"9px 16px",color:tab===k?C.primary:C.muted,fontSize:13,fontWeight:tab===k?700:500,display:"flex",alignItems:"center",gap:7}}><I size={14}/>{l}</button>
        ))}
      </div>

      {tab==="contas"&&(
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div style={{...neu.flat,padding:24}}>
            <h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:"0 0 18px"}}>Adicionar Conta Instagram</h3>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><label style={lbl}>Nome da Conta (sem @)</label><input style={inp} placeholder="doramas" value={form.conta} onChange={e=>setForm(f=>({...f,conta:e.target.value}))}/></div>
              <div><label style={lbl}>Access Token (Meta Graph API)</label><input style={inp} type="password" placeholder="EAABm..." value={form.token} onChange={e=>setForm(f=>({...f,token:e.target.value}))}/><p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Obtenha em developers.facebook.com → Graph API Explorer</p></div>
              <div><label style={lbl}>Instagram Business Account ID</label><input style={inp} placeholder="17841400..." value={form.ig_user_id} onChange={e=>setForm(f=>({...f,ig_user_id:e.target.value}))}/><p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>GET /me/accounts → instagramBusinessAccount.id</p></div>
              <button onClick={addAcc} style={{...neu.primary,padding:"13px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Plus size={15}/> Adicionar Conta</button>
            </div>
          </div>
          {accounts.length>0&&(
            <div style={{...neu.flat,overflow:"hidden"}}>
              <div style={{padding:"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{fontSize:15,fontWeight:700,color:C.onSurface}}>Contas Conectadas ({accounts.length})</span></div>
              {accounts.map((acc,idx)=>{const color=AVATAR_COLORS[idx%AVATAR_COLORS.length];return(
                <div key={acc.conta} style={{display:"flex",alignItems:"center",padding:"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:`${color}20`,display:"flex",alignItems:"center",justifyContent:"center",marginRight:14,border:`2px solid ${color}40`}}>
                    <span style={{fontSize:14,fontWeight:800,color}}>{acc.conta[0].toUpperCase()}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:C.onSurface,fontSize:14}}>@{acc.conta}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>ID: {acc.ig_user_id}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:C.secondary,background:"rgba(78,222,163,0.1)",padding:"3px 10px",borderRadius:20}}>Ativa</span>
                    <button onClick={()=>removeAcc(acc.conta)} style={{...neu.btn,padding:"6px 10px",color:C.error,display:"flex",alignItems:"center"}}><Trash2 size={13}/></button>
                  </div>
                </div>);})}
            </div>
          )}
        </div>
      )}

      {tab==="integracoes"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{...neu.flat,padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><Database size={18} style={{color:C.primary}}/><h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Supabase</h3></div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><label style={lbl}>URL do Projeto</label><input style={inp} placeholder="https://xxx.supabase.co" value={cfg.supabase_url||""} onChange={e=>setCfg(c=>({...c,supabase_url:e.target.value}))}/></div>
              <div><label style={lbl}>Service Role Key</label><input style={inp} type="password" placeholder="eyJhbG..." value={cfg.supabase_key||""} onChange={e=>setCfg(c=>({...c,supabase_key:e.target.value}))}/><p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Settings → API → service_role key (nao exponha publicamente)</p></div>
              <button onClick={saveCfg} style={{...neu.primary,padding:"11px",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Check size={14}/> Salvar Supabase</button>
            </div>
          </div>
          <div style={{...neu.flat,padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><Webhook size={18} style={{color:C.secondary}}/><h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>n8n Webhook</h3></div>
            <div><label style={lbl}>URL do Webhook (trigger manual)</label><input style={inp} placeholder="https://n8nwebhook.fullstek.space/webhook/..." value={cfg.n8n_webhook||""} onChange={e=>setCfg(c=>({...c,n8n_webhook:e.target.value}))}/><p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>O n8n ja executa automaticamente a cada 5 min. Isso e para trigger manual.</p></div>
            <button onClick={saveCfg} style={{...neu.primary,padding:"11px",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:14}}><Check size={14}/> Salvar n8n</button>
          </div>
        </div>
      )}

      {tab==="ia"&&(
        <div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Sparkles size={18} style={{color:C.primary}}/><h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Integracao de IA</h3></div>
          <div style={{...neu.inset,padding:14,borderRadius:14,border:"1px solid rgba(173,198,255,0.1)"}}>
            <p style={{fontSize:13,color:C.muted,margin:0,lineHeight:1.7}}>Use <strong style={{color:C.primary}}>OpenRouter</strong> (modelos gratuitos disponíveis) ou <strong style={{color:C.primary}}>Anthropic</strong>. Key comeca com <code style={{background:"rgba(0,0,0,0.3)",padding:"1px 5px",borderRadius:4,fontSize:11}}>sk-or-</code> ou <code style={{background:"rgba(0,0,0,0.3)",padding:"1px 5px",borderRadius:4,fontSize:11}}>sk-ant-</code>.</p>
          </div>
          <div><label style={lbl}>API Key *</label>
            <input style={inp} type="password" placeholder="sk-or-v1-... ou sk-ant-api03-..." value={cfg.ai_key||""} onChange={e=>setCfg(c=>({...c,ai_key:e.target.value}))}/>
            <p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>OpenRouter: openrouter.ai/keys | Anthropic: console.anthropic.com</p>
          </div>
          <div><label style={lbl}>Modelo</label>
            <select style={{...inp,cursor:"pointer"}} value={cfg.ai_model||"meta-llama/llama-3.3-8b-instruct:free"} onChange={e=>setCfg(c=>({...c,ai_model:e.target.value}))}>
              {MODELS.map(m=><option key={m} value={m} style={{background:"#12192b"}}>{m}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Instrucoes Personalizadas</label>
            <textarea style={{...inp,minHeight:80,resize:"vertical"}} placeholder="Ex: Sempre use tom divertido. Foco em cultura coreana. Maximo 150 palavras." value={cfg.ai_prompt||""} onChange={e=>setCfg(c=>({...c,ai_prompt:e.target.value}))}/>
          </div>
          <button onClick={saveCfg} style={{...neu.primary,padding:"12px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Sparkles size={15}/> Salvar IA</button>
        </div>
      )}

      {tab==="geral"&&(
        <div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:20}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Preferencias Gerais</h3>
          <div><label style={lbl}>Nome do App</label><input style={inp} placeholder="SocialHub" value={cfg.app_name||""} onChange={e=>setCfg(c=>({...c,app_name:e.target.value}))}/></div>
          <div><label style={lbl}>Hashtags Padrao</label>
            <textarea style={{...inp,minHeight:70,resize:"vertical"}} placeholder="#kpop #kdrama #koreanculture #brasil" value={cfg.default_hashtags||""} onChange={e=>setCfg(c=>({...c,default_hashtags:e.target.value}))}/>
            <p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Adicionadas automaticamente ao final de todos os posts</p>
          </div>
          <div><label style={lbl}>Fuso Horario</label>
            <select style={{...inp,cursor:"pointer"}} value={cfg.timezone||"America/Sao_Paulo"} onChange={e=>setCfg(c=>({...c,timezone:e.target.value}))}>
              {["America/Sao_Paulo","America/Manaus","America/Fortaleza","America/Belem","America/Recife","America/Bahia"].map(t=><option key={t} value={t} style={{background:"#12192b"}}>{t}</option>)}
            </select>
          </div>
          <button onClick={saveCfg} style={{...neu.primary,padding:"12px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Check size={15}/> Salvar Preferencias</button>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:16}}>
            <p style={{fontSize:13,color:C.error,fontWeight:700,margin:"0 0 10px"}}>Zona de Perigo</p>
            <button onClick={()=>{if(confirm("Limpar TODAS as configuracoes e dados locais?")){{localStorage.clear();window.location.reload();}}}} style={{...neu.btn,padding:"9px 16px",fontSize:13,color:C.error}}>Limpar tudo e reiniciar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ posts, loading, onRefresh, onNav }) {
  const pend=posts.filter(p=>p.status==="pendente").length;
  const pub=posts.filter(p=>p.status==="publicado").length;
  const err=posts.filter(p=>p.status==="erro").length;
  const cfg=getConfig();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>{cfg.app_name||"SocialHub"}</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>Painel de controle do seu Instagram</p></div>
        <button onClick={onRefresh} style={{...neu.btn,display:"flex",alignItems:"center",gap:7,padding:"9px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13} style={{animation:loading?"spin 1s linear infinite":"none"}}/> Atualizar</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
        {[{I:List,l:"Total",v:posts.length,c:C.primary},{I:Clock,l:"Pendentes",v:pend,c:C.tertiary,s:"aguardando n8n"},{I:CheckCircle,l:"Publicados",v:pub,c:C.secondary},{I:XCircle,l:"Erros",v:err,c:C.error}].map(({I,l,v,c,s})=>(
          <div key={l} style={{...neu.flat,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{l}</span>
              <div style={{...neu.inset,padding:7}}><I size={15} style={{color:c}}/></div>
            </div>
            <div style={{fontSize:36,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            {s&&<p style={{fontSize:11,color:C.muted,marginTop:4}}>{s}</p>}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div style={{...neu.flat,overflow:"hidden"}}>
          <div style={{padding:"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:16,fontWeight:700,color:C.onSurface}}>Posts Recentes</span>
            <span style={{fontSize:12,color:C.muted}}>{posts.length} total</span>
          </div>
          {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Loader2 size={26} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:
           posts.length===0?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 32px",gap:16}}>
              <div style={{...neu.inset,width:68,height:68,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={30} style={{color:C.muted,opacity:0.5}}/></div>
              <div style={{textAlign:"center"}}><h4 style={{color:C.onSurface,margin:"0 0 8px"}}>Nenhum post ainda</h4><p style={{color:C.muted,fontSize:14,maxWidth:260}}>Crie seu primeiro post para comecar.</p></div>
              <button onClick={()=>onNav("novo")} style={{...neu.primary,padding:"11px 24px",fontSize:14}}>Criar Primeiro Post</button>
            </div>
           ):(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{["","Legenda","Contas","Status","Quando"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}</tr></thead>
              <tbody>{posts.slice(0,8).map((p,i)=>{let c=[];try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{}return(
                <tr key={p.id} style={{borderBottom:i<7?"1px solid rgba(255,255,255,0.04)":"none"}}>
                  <td style={{padding:"11px 16px"}}>{p.tipo==="REELS"?<Film size={14} style={{color:"#a78bfa"}}/>:<Image size={14} style={{color:C.primary}}/>}</td>
                  <td style={{padding:"11px 16px",color:C.muted,fontSize:13,maxWidth:160}}><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.legenda||"—"}</span></td>
                  <td style={{padding:"11px 16px",color:C.muted,fontSize:12}}>{c.map(x=>x.conta||x).join(", ")||"—"}</td>
                  <td style={{padding:"11px 16px"}}>{statusBadge(p.status)}</td>
                  <td style={{padding:"11px 16px",color:C.muted,fontSize:12}}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</td>
                </tr>);})}
              </tbody>
            </table>
           )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{...neu.flat,padding:22}}>
            <h4 style={{color:C.onSurface,fontWeight:700,margin:"0 0 14px",fontSize:15}}>Estatisticas</h4>
            {[{l:"Taxa de sucesso",v:posts.length>0?`${Math.round((pub/posts.length)*100)}%`:"—",c:C.secondary},{l:"Pendentes",v:pend,c:C.tertiary},{l:"Esta semana",v:posts.filter(p=>{try{return(new Date()-new Date(p.created_at))<7*86400000;}catch{return false;}}).length,c:C.primary}].map(({l,v,c})=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <span style={{fontSize:13,color:C.muted}}>{l}</span>
                <span style={{fontSize:16,fontWeight:800,color:c}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{...neu.flat,padding:22,background:"linear-gradient(135deg,rgba(173,198,255,0.06),transparent)"}}>
            <h4 style={{color:C.primary,fontWeight:700,margin:"0 0 10px",fontSize:14}}>Dica Pro</h4>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:0}}>Publique Reels entre 18h-21h para maior alcance. Use IA para legendas com hashtags otimizadas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if(!toast) return null;
  const colors={success:C.secondary,error:C.error,info:C.primary};
  return (
    <div style={{position:"fixed",bottom:28,right:28,display:"flex",alignItems:"center",gap:12,padding:"13px 20px",background:"#1a2235",border:`1px solid ${colors[toast.type]}40`,borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:1000,maxWidth:340}}>
      <div style={{width:26,height:26,borderRadius:"50%",background:`${colors[toast.type]}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {toast.type==="success"?<Check size={12} style={{color:C.secondary}}/>:toast.type==="error"?<X size={12} style={{color:C.error}}/>:<Bell size={12} style={{color:C.primary}}/>}
      </div>
      <span style={{fontSize:14,color:C.onSurface,fontWeight:500}}>{toast.message}</span>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [accounts, setAccounts] = useState(getAccounts);
  const cfg = getConfig();
  const showToast = useCallback((message,type="info")=>{ setToast({message,type}); setTimeout(()=>setToast(null),3500); },[]);
  const loadPosts = useCallback(async()=>{ setLoading(true); try{const d=await makeApi().getPosts(); if(Array.isArray(d))setPosts(d);}catch{showToast("Erro ao carregar posts","error");} setLoading(false); },[showToast]);
  useEffect(()=>{loadPosts();},[loadPosts]);
  const handleDelete = async(id)=>{ if(!confirm("Deletar este post?")) return; await makeApi().deletePost(id); setPosts(p=>p.filter(x=>x.id!==id)); showToast("Post deletado","success"); };
  const pend=posts.filter(p=>p.status==="pendente").length;
  const nav=[{k:"dashboard",I:LayoutDashboard,l:"Dashboard"},{k:"novo",I:Plus,l:"Novo Post"},{k:"fila",I:List,l:"Fila"},{k:"settings",I:Settings,l:"Configuracoes"}];

  return (<>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#12192b;color:#dae2fd;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}input,textarea,button,select{font-family:inherit}a{text-decoration:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}`}</style>
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      <aside style={{width:240,background:"#0e1423",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",padding:"28px 0",flexShrink:0}}>
        <div style={{padding:"0 22px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <h1 style={{fontSize:22,fontWeight:800,color:C.primary,margin:0}}>{cfg.app_name||"SocialHub"}</h1>
          <p style={{fontSize:10,color:C.muted,marginTop:3,fontFamily:"monospace"}}>Fullstek v2.0</p>
        </div>
        <nav style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:5}}>
          {nav.map(({k,I,l})=>{ const a=page===k; return (
            <button key={k} onClick={()=>setPage(k)} style={{...(a?neu.active:{}),display:"flex",alignItems:"center",gap:11,padding:"11px 13px",borderRadius:11,background:a?"#12192b":"transparent",border:a?"1px solid rgba(173,198,255,0.2)":"1px solid transparent",color:a?C.primary:C.muted,cursor:"pointer",fontSize:14,fontWeight:a?700:400,textAlign:"left",width:"100%",transition:"all 0.15s"}}>
              <I size={17}/>{l}
              {k==="fila"&&pend>0&&<span style={{marginLeft:"auto",background:C.tertiary,color:"#2a1700",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:800}}>{pend}</span>}
            </button>);})}
        </nav>
        <div style={{padding:"14px 14px 0"}}>
          <div style={{...neu.inset,display:"flex",alignItems:"center",gap:9,padding:"9px 13px",borderRadius:12}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.secondary,boxShadow:`0 0 8px ${C.secondary}`}}/>
            <span style={{fontSize:12,color:C.secondary,fontWeight:600}}>n8n ativo</span>
          </div>
        </div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{background:"rgba(18,25,43,0.85)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:13,color:C.muted}}>{accounts.length} conta{accounts.length!==1?"s":""} conectada{accounts.length!==1?"s":""}</span>
          <button onClick={loadPosts} style={{...neu.btn,display:"flex",alignItems:"center",gap:7,padding:"8px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13}/> Sincronizar</button>
        </header>
        <main style={{flex:1,overflow:"auto",padding:36,background:"#12192b"}}>
          {page==="dashboard"&&<Dashboard posts={posts} loading={loading} onRefresh={loadPosts} onNav={setPage}/>}
          {page==="novo"&&<NovoPost accounts={accounts} onSuccess={()=>{loadPosts();setPage("fila");}} onToast={showToast}/>}
          {page==="fila"&&<Fila posts={posts} loading={loading} onRefresh={loadPosts} onDelete={handleDelete}/>}
          {page==="settings"&&<SettingsPage accounts={accounts} setAccounts={setAccounts} onToast={showToast}/>}
        </main>
      </div>
    </div>
    <Toast toast={toast}/>
  </>);
}
