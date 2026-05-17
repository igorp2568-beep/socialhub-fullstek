import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Plus, List, CheckCircle, XCircle, Settings, Trash2, RefreshCw, Clock, Send, Image, Film, Bell, Check, X, Loader2, Eye, Upload, User, ChevronLeft, ChevronRight, Sparkles, Webhook, Database, AlertCircle, Zap, ExternalLink} from "lucide-react";nd:`${color}25`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${s?color:"transparent"}`}}>
            <span style={{fontSize:11,fontWeight:800,color}}>{acc.conta[0].toUpperCase()}</span>
          </div>
          <span style={{fontSize:13,fontWeight:s?700:500,color:s?C.onSurface:C.muted}}>@{acc.conta}</span>
        </button>
      );})}
    </div>
  );
}

function NovoPost({ accounts, onSuccess, onToast }) {
  const [form,setForm]=useState({legenda:"",postar_agora:true,data_agendada:""});
  const [file,setFile]=useState(null); const [sel,setSel]=useState([]);
  const [loading,setLoading]=useState(false); const [uploading,setUploading]=useState(false); const [showCal,setShowCal]=useState(false);
  const cfg=getConfig();
  const lbl={fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,display:"block",textTransform:"uppercase",letterSpacing:"0.06em"};
  const inp={...neu.inset,width:"100%",padding:"12px 14px",color:C.onSurface,fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b"};
  const submit=async()=>{
    if(!file) return onToast("Selecione uma midia","error");
    if(!sel.length) return onToast("Selecione pelo menos uma conta","error");
    if(!form.postar_agora&&!form.data_agendada) return onToast("Defina a data de agendamento","error");
    const tags=cfg.default_hashtags?"\n\n"+cfg.default_hashtags:"";
    setLoading(true);
    try{
      setUploading(true); const url=await makeApi().uploadFile(file); setUploading(false);
      await makeApi().createPost({url_midia:url,legenda:(form.legenda||"")+tags,tipo:detectType(file),contas:JSON.stringify(sel),status:"pendente",postar_agora:form.postar_agora,data_agendada:form.postar_agora?null:new Date(form.data_agendada).toISOString()});
      onToast("Post criado com sucesso!","success"); setForm({legenda:"",postar_agora:true,data_agendada:""}); setFile(null); setSel([]); setShowCal(false); onSuccess();
    }catch(e){setUploading(false);onToast("Erro: "+e.message,"error");} setLoading(false);
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
            {[{v:true,l:"Postar agora"},{v:false,l:"Agendar data"}].map(({v,l})=>(
              <button key={String(v)} onClick={()=>{setForm(f=>({...f,postar_agora:v}));if(!v)setShowCal(true);else setShowCal(false);}} style={{...(form.postar_agora===v?neu.active:neu.btn),flex:1,padding:"11px 0",color:form.postar_agora===v?C.primary:C.muted,fontWeight:form.postar_agora===v?700:500,fontSize:14}}>{v?"⚡ "+l:"📅 "+l}</button>
            ))}
          </div>
          {!form.postar_agora&&(<div>
            {form.data_agendada&&<div style={{...neu.inset,padding:"10px 14px",borderRadius:10,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:C.secondary,fontSize:13,fontWeight:600}}>📅 {new Date(form.data_agendada).toLocaleString("pt-BR")}</span>
              <button onClick={()=>setShowCal(!showCal)} style={{...neu.btn,padding:"4px 10px",fontSize:12,color:C.muted}}>{showCal?"Fechar":"Editar"}</button>
            </div>}
            {(!form.data_agendada||showCal)&&<MiniCalendar selectedDate={form.data_agendada} onChange={d=>{setForm(f=>({...f,data_agendada:d}));setShowCal(false);}}/>}
          </div>)}
        </div>
        <button onClick={submit} disabled={loading} style={{...neu.primary,padding:"14px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?0.7:1}}>
          {loading?<Loader2 size={17} style={{animation:"spin 1s linear infinite"}}/>:<Send size={17}/>}{loading?(uploading?"Enviando arquivo...":"Criando post..."):"Publicar Post"}
        </button>
      </div>
    </div>
  );
}

function Fila({ posts, loading, onRefresh, onDelete }) {
  const [filter,setFilter]=useState("todos");
  const filtered=filter==="todos"?posts:posts.filter(p=>p.status===filter);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Fila de Posts</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>{filtered.length} posts</p></div>
        <button onClick={onRefresh} style={{...neu.btn,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13}/> Atualizar</button>
      </div>
      <div style={{display:"flex",gap:8}}>{["todos","pendente","publicado","erro"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{...(filter===f?neu.active:neu.btn),padding:"7px 16px",color:filter===f?C.primary:C.muted,fontSize:13,fontWeight:filter===f?700:500,textTransform:"capitalize"}}>{f}</button>)}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Loader2 size={28} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:
         filtered.length===0?<div style={{...neu.flat,textAlign:"center",padding:48,color:C.muted}}>Nenhum post encontrado</div>:
         filtered.map(p=>{let c=[];try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{}return(
           <div key={p.id} style={{...neu.flat,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
             <div style={{width:46,height:46,borderRadius:12,background:p.tipo==="REELS"?"rgba(167,139,250,0.15)":"rgba(173,198,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
               {p.tipo==="REELS"?<Film size={20} style={{color:"#a78bfa"}}/>:<Image size={20} style={{color:C.primary}}/>}
             </div>
             <div style={{flex:1,minWidth:0}}>
               <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                 {sBadge(p.status)}{c.map(x=><span key={x.conta||x} style={{fontSize:11,color:C.muted,background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:20}}>@{x.conta||x}</span>)}
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
  const [tab,setTab]=useState("contas");
  const [cfg,setCfg]=useState(getConfig);
  const [form,setForm]=useState({conta:"",token:"",ig_user_id:""});
  const [oauthLoading,setOauthLoading]=useState(false);
  const inp={...neu.inset,width:"100%",padding:"11px 14px",color:C.onSurface,fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b"};
  const lbl={fontSize:12,fontWeight:700,color:C.muted,marginBottom:7,display:"block",textTransform:"uppercase",letterSpacing:"0.06em"};
  const save=()=>{ localStorage.setItem("sh_config",JSON.stringify(cfg)); onToast("Salvo!","success"); };
  const addAcc=()=>{ if(!form.conta||!form.token||!form.ig_user_id) return onToast("Preencha todos os campos","error"); const u=[...accounts,{...form}]; setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); setForm({conta:"",token:"",ig_user_id:""}); onToast("Conta adicionada!","success"); };
  const removeAcc=(c)=>{ if(!confirm(`Remover @${c}?`)) return; const u=accounts.filter(a=>a.conta!==c); setAccounts(u); localStorage.setItem("socialhub_accounts",JSON.stringify(u)); onToast("Removida","success"); };
  const provider=cfg.ai_provider||"openrouter";
  const pInfo=AI_PROVIDERS[provider];

  const connectInstagram=async()=>{
    setOauthLoading(true);
    const appId=cfg.meta_app_id||META_APP_ID;
    const redirectUri=encodeURIComponent(window.location.origin);
    const scope="instagram_basic,instagram_content_publish,pages_read_engagement,business_management,pages_show_list";
    window.location.href=`https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&auth_type=rerequest`;
  };
p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Obter key em: <a href={`https://${pInfo.link}`} target="_blank" rel="noopener noreferrer" style={{color:C.primary}}>{pInfo.link}</a></p>}
          </div>
          {provider==="custom"&&(
            <div><label style={lbl}>URL da API (compativel com OpenAI)</label><input style={inp} placeholder="https://sua-api.com/v1/chat/completions" value={cfg.ai_custom_url||""} onChange={e=>setCfg(c=>({...c,ai_custom_url:e.target.value}))}/></div>
          )}
          <div>
            <label style={lbl}>Modelo</label>
            {pInfo?.models?.length>0?(
              <select style={{...inp,cursor:"pointer"}} value={cfg.ai_model||pInfo.models[0]} onChange={e=>setCfg(c=>({...c,ai_model:e.target.value}))}>
                {pInfo.models.map(m=><option key={m} value={m} style={{background:"#12192b"}}>{m}</option>)}
              </select>
            ):(
              <input style={inp} placeholder="nome-do-modelo" value={cfg.ai_model||""} onChange={e=>setCfg(c=>({...c,ai_model:e.target.value}))}/>
            )}
          </div>
          <div><label style={lbl}>Instrucoes Personalizadas</label>
            <textarea style={{...inp,minHeight:70,resize:"vertical"}} placeholder="Ex: Sempre use tom divertido. Foco em cultura coreana." value={cfg.ai_prompt||""} onChange={e=>setCfg(c=>({...c,ai_prompt:e.target.value}))}/>
          </div>
          <button onClick={save} style={{...neu.primary,padding:"12px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Sparkles size={14}/> Salvar IA</button>
        </div>
      )}

      {tab==="geral"&&(
        <div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:20}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Preferencias</h3>
          <div><label style={lbl}>Nome do App</label><input style={inp} placeholder="SocialHub" value={cfg.app_name||""} onChange={e=>setCfg(c=>({...c,app_name:e.target.value}))}/></div>
          <div><label style={lbl}>Hashtags Padrao</label>
            <textarea style={{...inp,minHeight:70,resize:"vertical"}} placeholder="#kpop #kdrama #koreanculture" value={cfg.default_hashtags||""} onChange={e=>setCfg(c=>({...c,default_hashtags:e.target.value}))}/>
            <p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Adicionadas ao final de todos os posts</p>
          </div>
          <div><label style={lbl}>Fuso Horario</label>
            <select style={{...inp,cursor:"pointer"}} value={cfg.timezone||"America/Sao_Paulo"} onChange={e=>setCfg(c=>({...c,timezone:e.target.value}))}>
              {["America/Sao_Paulo","America/Manaus","America/Fortaleza","America/Belem","America/Recife","America/Bahia"].map(t=><option key={t} value={t} style={{background:"#12192b"}}>{t}</option>)}
            </select>
          </div>
          <button onClick={save} style={{...neu.primary,padding:"12px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Check size={14}/> Salvar</button>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:16}}>
            <p style={{fontSize:13,color:C.error,fontWeight:700,margin:"0 0 10px"}}>Zona de Perigo</p>
            <button onClick={()=>{if(confirm("Limpar tudo?")){{localStorage.clear();window.location.reload();}}}} style={{...neu.btn,padding:"9px 16px",fontSize:13,color:C.error}}>Limpar tudo e reiniciar</button>
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
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{l}</span><div style={{...neu.inset,padding:7}}><I size={15} style={{color:c}}/></div></div>
            <div style={{fontSize:36,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            {s&&<p style={{fontSize:11,color:C.muted,marginTop:4}}>{s}</p>}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div style={{...neu.flat,overflow:"hidden"}}>
          <div style={{padding:"14px 22px",morderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,fontWeight:700,color:C.onSurface}}>Posts Recentes</span><span style={{fontSize:12,color:C.muted}}>{posts.length} total</span></div>
          {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Loader2 size={26} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:
           posts.length===0?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 32px",gap:16}}>
             <div style={{...neu.inset,width:68,height:68,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={30} style={{color:C.muted,opacity:0.5}}/></div>
             <div style={{textAlign:"center"}}><h4 style={{color:C.onSurface,margin:"0 0 8px"}}>Nenhum post ainda</h4><p style={{color:C.muted,fontSize:14,maxWidth:260}}>Crie seu primeiro post para comecar.</p></div>
             <button onClick={()=>onNav("novo")} style={{...neu.primary,padding:"11px 24px",fontSize:14}}>Criar Primeiro Post</button>
           </div>):(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{["","Legenda","Contas","Status","Quando"].map(h=><th key={h} style={{padding:"10px 16px"|,textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}</tr></thead>
              <tbody>{posts.slice(0,8).map((p,i)=>{let c=[];try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{}return(
                <tr key={p.id} style={{borderBottom:i<7?"1px solid rgba(255,255,255,0.04)":"none"}}>
                  <td style={{padding:"11px 16px"}}>{p.tipo==="REELS"?<Film size={14} style={{color:"#a78bfa"}}/>:<Image size={14} style={{color:C.primary}}/>}</td>
                  <td style={{padding:"11px 16px",color:C.muted,fontSize:13,maxWidth:160}}><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.legenda||"—"}</span></td>
                  <td style={{padding:"11px 16px",color:C.muted,fontSize:12}}>{c.map(x=>x.conta||x).join(", ")||"—"}</td>
                  <td style={{padding:"11px 16px"}}>{sBadge(p.status)}</td>
                  <td style={{padding:"11px 16px",color:C.muted,fontSize:12}}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</td>
                </tr>);})}
              </tbody>
            </table>
           )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{...neu.flat,padding:22}}><h4 style={{color:C.onSurface,fontWeight:700,margin:"0 0 14px",fontSize:15}}>Estatisticas</h4>{[{l:"Taxa de sucesso",v:posts.length>0?Math.round((pub/posts.length)*100)+"%":"—",c:C.secondary},{l:"Pendentes",v:pend,c:C.tertiary},{l:"Esta semana",v:posts.filter(p=>{try{return(new Date()-new Date(p.created_at))<7*86400000;}catch{return false;}}).length,c:C.primary}].map(({l,v,c})=>( <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><span style={{fontSize:13,color:C.muted}}>{l}</span><span style={{fontSize:16,fontWeight:800,color:c}}>{v}</span></div>))}</div>
          <div style={{...neu.flat,padding:22,background:"linear-gradient(135deg,rgba(173,198,255,0.06),transparent)"}}><h4 style={{color:C.primary,fontWeight:700,margin:"0 0 10px",fontSize:14}}>Dica Pro</h4><p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:0}}>Reels entre 18h-21h geram mais alcance. Use IA para legendas com hashtags otimizadas.</p></div>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if(!toast) return null;
  const colors={success:C.secondary,error:C.error,info:C.primary};
  return <div style={{position:"fixed",bottom:28,right:28,display:"flex",alignItems:"center",gap:12,padding:"13px 20px",background:"#1a2235",morder:`1px solid ${colors[toast.type]}40`,borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:1000,maxWidth:340}}>
    <div style={{width:26,height:26,borderRadius:"50%",background:`${colors[toast.type]}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>{toast.type==="success"?<Check size={12} style={{color:C.secondary}}/>:toast.type==="error"?<X size={12} style={{color:C.error}}/>:<Bell size={12} style={{color:C.primary}}/>}</div>
    <span style={{fontSize:14,color:C.onSurface,fontWeight:500}}>{toast.message}</span>
  </div>;
}

export default function App() {
  const [page,setPage]=useState("dashboard");
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState(null);
  const [accounts,setAccounts]=useState(getAccounts);
  const [oauthLoading,setOauthLoading]=useState(false);
  const cfg=getConfig();
  const showToast=useCallback((message,type="info")=>{setToast({message,type});setTimeout(()=>setToast(null),4000);},[]);
  const loadPosts=useCallback(async()=>{setLoading(true);try{const d=await makeApi().getPosts();if(Array.isArray(d))setPosts(d);}catch{showToast("Erro ao carregar","error");}setLoading(false);},[showToast]);
  useEffect(()=>{
    const hash=window.location.hash;
    if(!hash.includes("access_token=")) return;
    const params=new URLSearchParams(hash.slice(1));
    const shortToken=params.get("access_token");
    if(!shortToken) return;
    window.history.replaceState({},"",window.location.pathname);
    setOauthLoading(true);
    const appId=cfg.meta_app_id||META_APP_ID;
    const appSecret=cfg.meta_app_secret||META_APP_SECRET;
    (async()=>{
      try{
        showToast("Conectando contas Instagram...","info");
        const ltRes=await fetch("https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id="+appId+"&client_secret="+appSecret+"&fb_exchange_token="+ shortToken);
        const ltData=await ltRes.json();
        if(ltData.error) throw new Error(ltData.error.message);
        const longToken=ltData.access_token;
        const pgRes=await fetch("https://graph.facebook.com/v18.0/me/accounts?access_token="+longToken);
        const pgData=await pgRes.json();
        if(pgData.error) throw new Error(pgData.error.message);
        const found=[];
        for(const page of(pgData.data||[])){
          const igRes=await fetch("https://graph.facebook.com/v18.0/"+page.id+"?fields=instagram_business_account&access_token="+page.access_token);
          const igData=await igRes.json();
          if(igData.instagram_business_account?.id){
            const igId=igData.instagram_business_account.id;
            const detRes=await fetch("https://graph.facebook.com/v18.0/"+igId+"?fields=username&access_token="+page.access_token);
            const det=await detRes.json();
            found.push({conta:det.username||page.name,token:page.access_token,ig_user_id:igId});
          }
        }
        if(found.length===0){showToast("Nenhuma conta Instagram Business encontrada.","error");return;}
        const existing=getAccounts();
        const merged=[...existing];
        for(const a of found){if(!merged.find(x=>x.conta===a.conta)) merged.push(a);}
        setAccounts(merged);
        localStorage.setItem("socialhub_accounts",JSON.stringify(merged));
        showToast(found.length+" conta(s) conectada(s)!","success");
        setPage("settings");
      }catch(e){showToast("Erro no login: "+e.message,"error");}
      finally{setOauthLoading(false);}
    })();
  },[]);
  useEffect(()=>{loadPosts();},[loadPosts]);
  const handleDelete=async(id)=>{if(!confirm("Deletar este post?")) return;await makeApi().deletePost(id);setPosts(p=>p.filter(x=>x.id!==id));showToast("Post deletado","success");};
  const pend=posts.filter(p=>p.status==="pendente").length;
  const nav=[{k:"dashboard",I:LayoutDashboard,l:"Dashboard"},{k:"novo",I:Plus,l:"Novo Post"},{k:"fila",I:List,l:"Fila"},{k:"settings",I:Settings,l:"Configuracoes"}];
  return (<>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#12192b;color:#dae2fd;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}input,textarea,button,select{font-family:inherit}a{text-decoration:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}`}</style>
    {oauthLoading&&<div style={{position:"fixed",inset:0,background:"rgba(10,15,26,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,flexDirection:"column",gap:16}}><Loader2 size={40} style={{color:C.primary,animation:"spin 1s linear infinite"}}/><p style={{color:C.onSurface,fontSize:16,fontWeight:600}}>Conectando suas contas Instagram...</p></div>}
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      <aside style={{width:240,background:"#0e1423",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",padding:"28px 0",flexShrink:0}}>
        <div style={{padding:"0 22px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><h1 style={{fontSize:22,fontWeight:800,color:C.primary,margin:0}}>{cfg.app_name||"SocialHub"}</h1><p style={{fontSize:10,color:C.muted,marginTop:3,fontFamily:"monospace"}}>Fullstek v3.0</p></div>
        <nav style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:5}}>{nav.map(({k,I, l})=>{const a=page===k;return(<button key={k} onClick={()=>setPage(k)} style={{...(a?neu.active:{}),display:"flex",alignItems:"center",gap:11,padding:"11px 13px",borderRadius:11,background:a?"#12192b":"transparent",border:a?"1px solid rgba(173,198,255,0.2)":"1px solid transparent",color:a?C.primary:C.muted,cursor:"pointer",fontSize:14,fontWeight:a?700:400,textAlign:"left",width:"100%",transition:"all 0.15s"}}><I size={17}/>{l}{k==="fila"&&pend>0&&<span style={{marginLeft:"auto",background:C.tertiary,color:"#2a1700",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:800}}>{pend}</span>}</button>);})}</nav>
        <div style={{padding:"14px 14px 0"}}><div style={{...neu.inset,display:"flex",alignItems:"center",gap:9,padding:"9px 13px",borderRadius:12}}><div style={{width:7,height:7,borderRadius:"50%",background:C.secondary,boxShadow:"0 0 8px "+C.secondary}}/><span style={{fontSize:12,color:C.secondary,fontWeight:600}}>n8n ativo</span></div></div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{background:"rgba(18,25,43,0.85)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}><span style={{fontSize:13,color:C.muted}}>{accounts.length} conta conectada</span><button onClick={loadPosts} style={{...neu.btn,display:"flex",alignItems:"center",gap:7,padding:"8px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13}/> Sincronizar</button></header>
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
