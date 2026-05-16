import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Plus, List, CheckCircle, XCircle, Settings, Trash2, RefreshCw, Clock, Send, Image, Film, Bell, Check, X, Loader2, Eye, Upload, User, ChevronLeft, ChevronRight, Sparkles, Webhook, Database, AlertCircle } from "lucide-react";

const META_APP_ID = "26643189218612460";
const META_APP_SECRET = "ad8ea1cea78d758896dc9b03a8930341";

const getConfig = () => { try { return JSON.parse(localStorage.getItem("sh_config")||"{}"); } catch { return {}; } };
const getAccounts = () => { try { return JSON.parse(localStorage.getItem("socialhub_accounts")||"[]"); } catch { return []; } };

const AI_PROVIDERS = {
  openrouter: { name:"OpenRouter (multi gratuitos)", url:"https://openrouter.ai/api/v1/chat/completions", models:["meta-llama/llama-3.3-8b-instruct:free","google/gemini-2.0-flash-exp:free","deepseek/deepseek-r1:free","qwen/qwen3-8b:free","mistralai/mistral-7b-instruct:free"], placeholder:"sk-or-v1-...", link:"openrouter.ai/keys" },
  openai: { name:"OpenAI — ChatGPT", url:"https://api.openai.com/v1/chat/completions", models:["gpt-4o-mini","gpt-4o","gpt-4-turbo","gpt-3.5-turbo","o1-mini"], placeholder:"sk-...", link:"platform.openai.com/api-keys" },
  anthropic: { name:"Anthropic — Claude", url:"__anthropic__", models:["claude-haiku-4-5-20251001","claude-sonnet-4-6","claude-opus-4-6"], placeholder:"sk-ant-...", link:"console.anthropic.com" },
  google: { name:"Google — Gemini", url:"__google__", models:["gemini-2.0-flash","gemini-2.0-flash-thinking-exp","gemini-1.5-flash","gemini-1.5-pro","gemini-exp-1206"], placeholder:"AIzaSy...", link:"aistudio.google.com/app/apikey" },
  groq: { name:"Groq — ultra rapido", url:"https://api.groq.com/openai/v1/chat/completions", models:["llama-3.3-70b-versatile","llama-3.1-8b-instant","gemma2-9b-it","mixtral-8x7b-32768"], placeholder:"gsk_...", link:"console.groq.com/keys" },
  deepseek: { name:"DeepSeek (China)", url:"https://api.deepseek.com/v1/chat/completions", models:["deepseek-chat","deepseek-reasoner","deepseek-coder"], placeholder:"sk-...", link:"platform.deepseek.com" },
  qwen: { name:"Qwen / Alibaba (China)", url:"https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", models:["qwen-turbo","qwen-plus","qwen-max","qwen2.5-72b-instruct"], placeholder:"sk-...", link:"dashscope.aliyuncs.com" },
  moonshot: { name:"Moonshot / Kimi (China)", url:"https://api.moonshot.cn/v1/chat/completions", models:["moonshot-v1-8k","moonshot-v1-32k","moonshot-v1-128k"], placeholder:"sk-...", link:"platform.moonshot.cn" },
  zhipu: { name:"Zhipu AI / GLM (China)", url:"https://open.bigmodel.cn/api/paas/v4/chat/completions", models:["glm-4-flash","glm-4","glm-4-plus","glm-3-turbo"], placeholder:"sua-api-key", link:"open.bigmodel.cn" },
  doubao: { name:"ByteDance Doubao (China)", url:"https://ark.cn-beijing.volces.com/api/v3/chat/completions", models:["doubao-lite-4k","doubao-pro-4k","doubao-pro-32k","doubao-pro-128k"], placeholder:"seu-endpoint-id", link:"console.volcengine.com/ark" },
  minimax: { name:"MiniMax (China)", url:"https://api.minimax.chat/v1/text/chatcompletion_pro", models:["abab6.5s-chat","abab6.5-chat","abab5.5-chat"], placeholder:"sua-api-key", link:"api.minimax.chat" },
  mistral: { name:"Mistral AI (Europa)", url:"https://api.mistral.ai/v1/chat/completions", models:["mistral-small-latest","mistral-medium-latest","mistral-large-latest","open-mistral-nemo"], placeholder:"sua-api-key", link:"console.mistral.ai" },
  cohere: { name:"Cohere Command", url:"__cohere__", models:["command-r-plus","command-r","command","command-light"], placeholder:"sua-api-key", link:"dashboard.cohere.com" },
  custom: { name:"URL Personalizada", url:"__custom__", models:[], placeholder:"sua-api-key", link:null },
};

const aiGenerate = async (context, cfg) => {
  if (!cfg.ai_key) throw new Error("Configure sua API key em Configuracoes > IA");
  const provider = cfg.ai_provider || "openrouter";
  const model = cfg.ai_model || AI_PROVIDERS[provider]?.models[0];
  const basePrompt = cfg.ai_prompt ? cfg.ai_prompt+"\n\n" : "";
  const prompt = basePrompt+"Gere uma legenda criativa para Instagram sobre: \""+context+"\". Inclua emojis e hashtags relevantes. Responda APENAS com a legenda pronta.";
  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {method:"POST",headers:{"x-api-key":cfg.ai_key,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model,max_tokens:400,messages:[{role:"user",content:prompt}]})});
    const d = await r.json(); if(d.error) throw new Error(d.error.message); return d.content?.[0]?.text;
  }
  if (provider === "google") {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+cfg.ai_key, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
    const d = await r.json(); if(d.error) throw new Error(d.error.message); return d.candidates?.[0]?.content?.parts?.[0]?.text;
  }
  if (provider === "cohere") {
    const r = await fetch("https://api.cohere.ai/v1/chat", {method:"POST",headers:{"Authorization":"Bearer "+cfg.ai_key,"Content-Type":"application/json"},body:JSON.stringify({model,message:prompt})});
    const d = await r.json(); if(d.message) throw new Error(d.message); return d.text;
  }
  const url = provider === "custom" ? cfg.ai_custom_url : AI_PROVIDERS[provider]?.url;
  if(!url) throw new Error("URL nao configurada para este provedor");
  const headers = {"Authorization":"Bearer "+cfg.ai_key,"Content-Type":"application/json"};
  if (provider === "openrouter") headers["HTTP-Referer"] = "https://socialhub-fullstek.vercel.app";
  const r = await fetch(url, {method:"POST",headers,body:JSON.stringify({model,messages:[{role:"user",content:prompt}]})});
  const d = await r.json();
  if(d.error) throw new Error(typeof d.error==="string"?d.error:d.error?.message||JSON.stringify(d.error));
  return d.choices?.[0]?.message?.content;
};

const makeApi = () => {
  const cfg = getConfig();
  const URL2 = cfg.supabase_url || "https://khngocwvmkfcqokwiahz.supabase.co";
  const KEY = cfg.supabase_key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobmdvY3d2bWtmY3Fva3dpYWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkyNTE2NywiZXhwIjoyMDkzNTAxMTY3fQ.x7sa03oibnA_eBQ5Q_7AF81oPIiShwItmKFjR9ODPFk";
  const h = {"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"return=representation"};
  return {
    async getPosts() { const r=await fetch(URL2+"/rest/v1/posts?select=*&order=created_at.desc",{headers:h}); return r.json(); },
    async createPost(d) { const r=await fetch(URL2+"/rest/v1/posts",{method:"POST",headers:h,body:JSON.stringify(d)}); return r.json(); },
    async deletePost(id) { await fetch(URL2+"/rest/v1/posts?id=eq."+id,{method:"DELETE",headers:h}); },
    async uploadFile(file) {
      const name=Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
      const r=await fetch(URL2+"/storage/v1/object/posts/"+name,{method:"POST",headers:{"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":file.type,"x-upsert":"false"},body:file});
      if(!r.ok) throw new Error("Upload falhou - verifique o bucket posts no Supabase");
      return URL2+"/storage/v1/object/public/posts/"+name;
    }
  };
};

const detectType = (file) => file.type.startsWith("video/") ? "REELS" : "IMAGE";
const neu = {
  flat:{background:"#12192b",boxShadow:"8px 8px 16px #090d16,-4px -4px 12px rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:24},
  inset:{background:"#12192b",boxShadow:"inset 4px 4px 8px #090d16,inset -2px -2px 6px rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.02)",borderRadius:12},
  btn:{background:"#12192b",boxShadow:"4px 4px 8px #090d16,-2px -2px 6px rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,cursor:"pointer",transition:"all 0.2s"},
  primary:{background:"#adc6ff",boxShadow:"4px 4px 12px rgba(0,0,0,0.3),inset 1px 1px 2px rgba(255,255,255,0.4)",color:"#002e6a",borderRadius:16,border:"none",cursor:"pointer",fontWeight:700,transition:"all 0.2s"},
  active:{background:"#12192b",boxShadow:"inset 4px 4px 8px #090d16,inset -2px -2px 6px rgba(255,255,255,0.02)",border:"1px solid rgba(173,198,255,0.2)",borderRadius:12},
};
const C={primary:"#adc6ff",secondary:"#4edea3",tertiary:"#ffb95f",error:"#ffb4ab",onSurface:"#dae2fd",muted:"#8c909f"};
const COLORS=["#adc6ff","#4edea3","#ffb95f","#c084fc","#f472b6","#60a5fa","#34d399","#fb923c"];
const sBadge=(s)=>{const m={pendente:{c:C.tertiary,l:"Pendente",I:Clock},publicado:{c:C.secondary,l:"Publicado",I:CheckCircle},erro:{c:C.error,l:"Erro",I:XCircle}};const x=m[s]||m.pendente;return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:x.c+"18",color:x.c,fontSize:11,fontWeight:600}}><x.I size={11}/>{x.l}</span>;};

function MiniCalendar({ selectedDate, onChange }) {
  const [view,setView]=useState(()=>{const d=selectedDate?new Date(selectedDate):new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  const today=new Date();const dim=new Date(view.y,view.m+1,0).getDate();const fd=new Date(view.y,view.m,1).getDay();
  const MN=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const sel=selectedDate?new Date(selectedDate):null;
  const pick=(day)=>{const d=new Date(view.y,view.m,day);const t=sel?"T"+String(sel.getHours()).padStart(2,"0")+":"+String(sel.getMinutes()).padStart(2,"0"):"T10:00";onChange(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(day).padStart(2,"0")+t);};
  const cells=[];for(let i=0;i<fd;i++) cells.push(null);for(let i=1;i<=dim;i++) cells.push(i);
  return (
    <div style={{...neu.inset,borderRadius:20,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <button onClick={()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{y:v.y,m:v.m-1})} style={{...neu.btn,padding:"6px 10px",color:C.muted}}><ChevronLeft size={14}/></button>
        <span style={{fontSize:14,fontWeight:700,color:C.onSurface}}>{MN[view.m]} {view.y}</span>
        <button onClick={()=>setView(v=>v.m===11?{y:v.y+1,m:0}:{y:v.y,m:v.m+1})} style={{...neu.btn,padding:"6px 10px",color:C.muted}}><ChevronRight size={14}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{["D","S","T","Q","Q","S","S"].map((d,i)=><span key={i} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:600,padding:"3px 0"}}>{d}</span>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((day,i)=>{if(!day) return <div key={i}/>;const iT=today.getFullYear()===view.y&&today.getMonth()===view.m&&today.getDate()===day;const iS=sel&&sel.getFullYear()===view.y&&sel.getMonth()===view.m&&sel.getDate()===day;return <button key={i} onClick={()=>pick(day)} style={{padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:iS||iT?700:400,background:iS?"#adc6ff":iT?"rgba(173,198,255,0.15)":"transparent",color:iS?"#002e6a":iT?C.primary:C.muted,transition:"all 0.15s"}}>{day}</button>;})}
      </div>
      {sel&&<div style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Horario</label><input type="time" value={String(sel.getHours()).padStart(2,"0")+":"+String(sel.getMinutes()).padStart(2,"0")} onChange={e=>{const[h,m]=e.target.value.split(":");const d=new Date(sel);d.setHours(+h,+m);onChange(d.toISOString().slice(0,16));}} style={{...neu.inset,padding:"8px 12px",color:C.onSurface,fontSize:13,outline:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,background:"#12192b",width:"100%"}}/></div>}
    </div>
  );
}

function FileDropzone({ onFile, file, uploading }) {
  const ref=useRef();const [drag,setDrag]=useState(false);
  const handle=(f)=>{if(f&&(f.type.startsWith("image/")||f.type.startsWith("video/"))) onFile(f);};
  const tipo=file?detectType(file):null;
  return (
    <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}} style={{...neu.inset,padding:28,textAlign:"center",cursor:"pointer",borderRadius:20,border:drag?"2px dashed "+C.primary:"2px dashed rgba(255,255,255,0.08)",transition:"all 0.2s"}}>
      <input ref={ref} type="file" accept="image/*,video/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
      {uploading?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><Loader2 size={32} style={{color:C.primary,animation:"spin 1s linear infinite"}}/><span style={{color:C.muted,fontSize:14}}>Enviando para Supabase Storage...</span></div>)
      :file?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        {file.type.startsWith("image/")?<img src={URL.createObjectURL(file)} style={{width:110,height:110,objectFit:"cover",borderRadius:14}} alt="preview"/>:<div style={{width:110,height:110,borderRadius:14,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><Film size={36} style={{color:"#a78bfa"}}/><span style={{fontSize:11,color:"#a78bfa",fontWeight:700}}>VIDEO</span></div>}
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,color:C.secondary,fontWeight:600}}>{file.name.slice(0,28)}{file.name.length>28?"...":""}</span><span style={{background:tipo==="REELS"?"rgba(167,139,250,0.2)":"rgba(173,198,255,0.2)",color:tipo==="REELS"?"#a78bfa":C.primary,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{tipo==="REELS"?"REEL":"FOTO"} auto</span></div>
        <span style={{color:C.muted,fontSize:12}}>Clique para trocar</span>
      </div>)
      :(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{...neu.flat,width:60,height:60,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><Upload size={26} style={{color:C.muted}}/></div>
        <p style={{color:C.onSurface,fontWeight:600,margin:0}}>Arraste ou clique para enviar</p>
        <p style={{color:C.muted,fontSize:12,margin:0}}>Fotos e Videos — tipo detectado automaticamente</p>
      </div>)}
    </div>
  );
}

function AICaptionGenerator({ onGenerate }) {
  const [ctx,setCtx]=useState("");const [loading,setLoading]=useState(false);
  const cfg=getConfig();const pName=AI_PROVIDERS[cfg.ai_provider||"openrouter"]?.name||"IA";
  const gen=async()=>{if(!ctx.trim()) return;setLoading(true);try{const c=await aiGenerate(ctx,cfg);onGenerate(c);}catch(e){alert("Erro IA: "+e.message);}setLoading(false);};
  if(!cfg.ai_key) return <div style={{...neu.inset,padding:12,borderRadius:12,display:"flex",alignItems:"center",gap:8,border:"1px solid rgba(245,158,11,0.2)"}}><AlertCircle size={13} style={{color:C.tertiary,flexShrink:0}}/><span style={{fontSize:12,color:C.muted}}>Configure API key em <strong style={{color:C.primary}}>Configuracoes > IA</strong></span></div>;
  return (
    <div style={{...neu.inset,borderRadius:14,padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><Sparkles size={13} style={{color:C.primary}}/><span style={{fontSize:11,fontWeight:700,color:C.primary,textTransform:"uppercase",letterSpacing:"0.05em"}}>Gerar com {pName}</span></div>
      <div style={{display:"flex",gap:8}}>
        <input value={ctx} onChange={e=>setCtx(e.target.value)} placeholder="Descreva o conteudo (ex: foto K-pop Seoul, pôr do sol na praia...)" style={{flex:1,...neu.inset,padding:"10px 12px",color:C.onSurface,fontSize:13,outline:"none",background:"#12192b",border:"1px solid rgba(255,255,255,0.08)"}} onKeyDown={e=>e.key==="Enter"&&gen()}/>
        <button onClick={gen} disabled={loading||!ctx.trim()} style={{...neu.primary,padding:"10px 14px",fontSize:13,display:"flex",alignItems:"center",gap:5,opacity:loading||!ctx.trim()?0.6:1}}>{loading?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Sparkles size={13}/>}Gerar</button>
      </div>
    </div>
  );
}

function AccountSelector({ accounts, selected, onChange }) {
  if(accounts.length===0) return <div style={{...neu.inset,padding:14,borderRadius:12,textAlign:"center",color:C.muted,fontSize:13}}>Nenhuma conta. Conecte em <strong style={{color:C.primary}}>Configuracoes > Contas</strong></div>;
  return <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{accounts.map((acc,idx)=>{const s=selected.find(a=>a.conta===acc.conta);const color=COLORS[idx%COLORS.length];return(<button key={acc.conta} onClick={()=>onChange(p=>s?p.filter(a=>a.conta!==acc.conta):[...p,acc])} style={{...(s?neu.active:neu.btn),display:"flex",alignItems:"center",gap:8,padding:"8px 14px",position:"relative"}}>{s&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={9} style={{color:"#002e6a"}}/></div>}<div style={{width:28,height:28,borderRadius:"50%",background:color+"25",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+(s?color:"transparent")}}><span style={{fontSize:11,fontWeight:800,color}}>{acc.conta[0].toUpperCase()}</span></div><span style={{fontSize:13,fontWeight:s?700:500,color:s?C.onSurface:C.muted}}>@{acc.conta}</span></button>);})}</div>;
}

function NovoPost({ accounts, onSuccess, onToast }) {
  const [form,setForm]=useState({legenda:"",postar_agora:true,data_agendada:""});
  const [file,setFile]=useState(null);const [sel,setSel]=useState([]);
  const [loading,setLoading]=useState(false);const [uploading,setUploading]=useState(false);const [showCal,setShowCal]=useState(false);
  const cfg=getConfig();
  const lbl={fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,display:"block",textTransform:"uppercase",letterSpacing:"0.06em"};
  const inp={...neu.inset,width:"100%",padding:"12px 14px",color:C.onSurface,fontSize:14,outline:"none",boxSizing:"border-box",background:"#12192b"};
  const submit=async()=>{
    if(!file) return onToast("Selecione uma midia","error");
    if(!sel.length) return onToast("Selecione pelo menos uma conta","error");
    if(!form.postar_agora&&!form.data_agendada) return onToast("Defina a data","error");
    const tags=cfg.default_hashtags?"\n\n"+cfg.default_hashtags:"";
    setLoading(true);
    try{setUploading(true);const url=await makeApi().uploadFile(file);setUploading(false);
      await makeApi().createPost({url_midia:url,legenda:(form.legenda||"")+tags,tipo:detectType(file),contas:JSON.stringify(sel),status:"pendente",postar_agora:form.postar_agora,data_agendada:form.postar_agora?null:new Date(form.data_agendada).toISOString()});
      onToast("Post criado!","success");setForm({legenda:"",postar_agora:true,data_agendada:""});setFile(null);setSel([]);setShowCal(false);onSuccess();
    }catch(e){setUploading(false);onToast("Erro: "+e.message,"error");}setLoading(false);
  };
  return (
    <div style={{maxWidth:700,display:"flex",flexDirection:"column",gap:28}}>
      <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Novo Post</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>Crie e agende para publicacao automatica via n8n</p></div>
      <div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:22}}>
        <div><label style={lbl}>Midia *</label><FileDropzone onFile={setFile} file={file} uploading={uploading}/></div>
        <div><label style={lbl}>Legenda</label><AICaptionGenerator onGenerate={cap=>setForm(f=>({...f,legenda:cap}))}/><textarea style={{...inp,minHeight:90,resize:"vertical",marginTop:8}} placeholder="Escreva ou gere com IA acima..." value={form.legenda} onChange={e=>setForm(f=>({...f,legenda:e.target.value}))}/>{cfg.default_hashtags&&<p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>+ Hashtags padrao adicionadas automaticamente</p>}</div>
        <div><label style={lbl}>Contas *</label><AccountSelector accounts={accounts} selected={sel} onChange={setSel}/></div>
        <div>
          <label style={lbl}>Agendamento</label>
          <div style={{display:"flex",gap:10,marginBottom:12}}>{[{v:true,l:"Postar agora"},{v:false,l:"Agendar data"}].map(({v,l})=><button key={String(v)} onClick={()=>{setForm(f=>({...f,postar_agora:v}));if(!v)setShowCal(true);else setShowCal(false);}} style={{...(form.postar_agora===v?neu.active:neu.btn),flex:1,padding:"11px 0",color:form.postar_agora===v?C.primary:C.muted,fontWeight:form.postar_agora===v?700:500,fontSize:14}}>{v?"⚡ "+l:"📅 "+l}</button>)}</div>
          {!form.postar_agora&&(<div>{form.data_agendada&&<div style={{...neu.inset,padding:"10px 14px",borderRadius:10,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:C.secondary,fontSize:13,fontWeight:600}}>📅 {new Date(form.data_agendada).toLocaleString("pt-BR")}</span><button onClick={()=>setShowCal(!showCal)} style={{...neu.btn,padding:"4px 10px",fontSize:12,color:C.muted}}>{showCal?"Fechar":"Editar"}</button></div>}{(!form.data_agendada||showCal)&&<MiniCalendar selectedDate={form.data_agendada} onChange={d=>{setForm(f=>({...f,data_agendada:d}));setShowCal(false);}}/>}</div>)}
        </div>
        <button onClick={submit} disabled={loading} style={{...neu.primary,padding:"14px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?0.7:1}}>{loading?<Loader2 size={17} style={{animation:"spin 1s linear infinite"}}/>:<Send size={17}/>}{loading?(uploading?"Enviando...":"Criando post..."):"Publicar Post"}</button>
      </div>
    </div>
  );
}

function Fila({ posts, loading, onRefresh, onDelete }) {
  const [filter,setFilter]=useState("todos");
  const filtered=filter==="todos"?posts:posts.filter(p=>p.status===filter);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Fila de Posts</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>{filtered.length} posts</p></div><button onClick={onRefresh} style={{...neu.btn,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13}/> Atualizar</button></div>
      <div style={{display:"flex",gap:8}}>{["todos","pendente","publicado","erro"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{...(filter===f?neu.active:neu.btn),padding:"7px 16px",color:filter===f?C.primary:C.muted,fontSize:13,fontWeight:filter===f?700:500,textTransform:"capitalize"}}>{f}</button>)}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Loader2 size={28} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:filtered.length===0?<div style={{...neu.flat,textAlign:"center",padding:48,color:C.muted}}>Nenhum post encontrado</div>:
         filtered.map(p=>{let c=[];try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{}return(
           <div key={p.id} style={{...neu.flat,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
             <div style={{width:46,height:46,borderRadius:12,background:p.tipo==="REELS"?"rgba(167,139,250,0.15)":"rgba(173,198,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{p.tipo==="REELS"?<Film size={20} style={{color:"#a78bfa"}}/>:<Image size={20} style={{color:C.primary}}/>}</div>
             <div style={{flex:1,minWidth:0}}>
               <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>{sBadge(p.status)}{c.map(x=><span key={x.conta||x} style={{fontSize:11,color:C.muted,background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:20}}>@{x.conta||x}</span>)}</div>
               <p style={{margin:"0 0 4px",color:C.onSurface,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.legenda||<span style={{color:C.muted,fontStyle:"italic"}}>sem legenda</span>}</p>
               <span style={{fontSize:11,color:C.muted}}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</span>
             </div>
             <div style={{display:"flex",gap:8}}><a href={p.url_midia} target="_blank" rel="noopener noreferrer" style={{...neu.btn,padding:"7px 10px",color:C.muted,display:"flex",alignItems:"center"}}><Eye size={14}/></a><button onClick={()=>onDelete(p.id)} style={{...neu.btn,padding:"7px 10px",color:C.error,display:"flex",alignItems:"center"}}><Trash2 size={14}/></button></div>
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
  const save=()=>{localStorage.setItem("sh_config",JSON.stringify(cfg));onToast("Salvo!","success");};
  const addAcc=()=>{if(!form.conta||!form.token||!form.ig_user_id) return onToast("Preencha todos","error");const u=[...accounts,{...form}];setAccounts(u);localStorage.setItem("socialhub_accounts",JSON.stringify(u));setForm({conta:"",token:"",ig_user_id:""});onToast("Conta adicionada!","success");};
  const removeAcc=(c)=>{if(!confirm("Remover @"+c+"?")) return;const u=accounts.filter(a=>a.conta!==c);setAccounts(u);localStorage.setItem("socialhub_accounts",JSON.stringify(u));onToast("Removida","success");};
  const provider=cfg.ai_provider||"openrouter";const pInfo=AI_PROVIDERS[provider];

  const connectInstagram=()=>{
    const appId=cfg.meta_app_id||META_APP_ID;
    const redirectUri=encodeURIComponent(window.location.origin);
    const scope="instagram_basic,instagram_content_publish,pages_read_engagement,business_management,pages_show_list";
    window.location.href="https://www.facebook.com/dialog/oauth?client_id="+appId+"&redirect_uri="+redirectUri+"&scope="+scope+"&response_type=token&auth_type=rerequest";
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:720}}>
      <div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>Configuracoes</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>Contas, integracoes e preferencias</p></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[{k:"contas",l:"Contas"},{k:"integracoes",l:"Integracoes"},{k:"ia",l:"IA"},{k:"geral",l:"Geral"}].map(({k,l})=><button key={k} onClick={()=>setTab(k)} style={{...(tab===k?neu.active:neu.btn),padding:"9px 18px",color:tab===k?C.primary:C.muted,fontSize:13,fontWeight:tab===k?700:500}}>{l}</button>)}</div>

      {tab==="contas"&&(<div style={{display:"flex",flexDirection:"column",gap:20}}>
        <div style={{...neu.flat,padding:28}}>
          <h3 style={{fontSize:17,fontWeight:700,color:C.onSurface,margin:"0 0 8px"}}>Conectar Instagram</h3>
          <p style={{fontSize:13,color:C.muted,margin:"0 0 20px",lineHeight:1.6}}>Clique abaixo para entrar com sua conta do Facebook. Suas contas Instagram Business serao detectadas automaticamente.</p>
          <button onClick={connectInstagram} style={{...neu.primary,padding:"14px 28px",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}>
            <span style={{fontSize:18,fontWeight:900}}>f</span>Entrar com Facebook / Instagram
          </button>
          <p style={{fontSize:11,color:C.muted,margin:"10px 0 0",textAlign:"center"}}>Necessita de conta Instagram Business ou Creator vinculada ao Facebook.</p>
        </div>
        <div style={{...neu.flat,padding:24}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.onSurface,margin:"0 0 4px"}}>Adicionar Manualmente</h3>
          <p style={{fontSize:12,color:C.muted,margin:"0 0 14px"}}>Ja tem o token e o ID? Cole aqui.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={lbl}>Nome da Conta</label><input style={inp} placeholder="doramas" value={form.conta} onChange={e=>setForm(f=>({...f,conta:e.target.value}))}/></div>
            <div><label style={lbl}>Access Token</label><input style={inp} type="password" placeholder="EAABm..." value={form.token} onChange={e=>setForm(f=>({...f,token:e.target.value}))}/></div>
            <div><label style={lbl}>Instagram Account ID</label><input style={inp} placeholder="17841400..." value={form.ig_user_id} onChange={e=>setForm(f=>({...f,ig_user_id:e.target.value}))}/></div>
            <button onClick={addAcc} style={{...neu.btn,padding:"11px",fontSize:13,color:C.primary,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Plus size={14}/> Adicionar</button>
          </div>
        </div>
        {accounts.length>0&&(<div style={{...neu.flat,overflow:"hidden"}}>
          <div style={{padding:"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{fontSize:15,fontWeight:700,color:C.onSurface}}>Contas Conectadas ({accounts.length})</span></div>
          {accounts.map((acc,idx)=>{const color=COLORS[idx%COLORS.length];return(
            <div key={acc.conta} style={{display:"flex",alignItems:"center",padding:"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:color+"20",display:"flex",alignItems:"center",justifyContent:"center",marginRight:14,border:"2px solid "+color+"40"}}><span style={{fontSize:14,fontWeight:800,color}}>{acc.conta[0].toUpperCase()}</span></div>
              <div style={{flex:1}}><div style={{fontWeight:700,color:C.onSurface,fontSize:14}}>@{acc.conta}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>ID: {acc.ig_user_id}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:C.secondary,background:"rgba(78,222,163,0.1)",padding:"3px 10px",borderRadius:20}}>Ativa</span><button onClick={()=>removeAcc(acc.conta)} style={{...neu.btn,padding:"6px 10px",color:C.error,display:"flex",alignItems:"center"}}><Trash2 size={13}/></button></div>
            </div>);})}
        </div>)}
      </div>)}

      {tab==="integracoes"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{...neu.flat,padding:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><Database size={17} style={{color:C.primary}}/><h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Supabase</h3></div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={lbl}>URL do Projeto</label><input style={inp} placeholder="https://xxx.supabase.co" value={cfg.supabase_url||""} onChange={e=>setCfg(c=>({...c,supabase_url:e.target.value}))}/></div>
            <div><label style={lbl}>Service Role Key</label><input style={inp} type="password" placeholder="eyJhbG..." value={cfg.supabase_key||""} onChange={e=>setCfg(c=>({...c,supabase_key:e.target.value}))}/><p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Settings > API > service_role</p></div>
            <button onClick={save} style={{...neu.primary,padding:"11px",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Check size={13}/> Salvar</button>
          </div>
        </div>
        <div style={{...neu.flat,padding:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><Webhook size={17} style={{color:C.secondary}}/><h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>n8n Webhook</h3></div>
          <div><label style={lbl}>URL do Webhook</label><input style={inp} placeholder="https://n8nwebhook.fullstek.space/webhook/..." value={cfg.n8n_webhook||""} onChange={e=>setCfg(c=>({...c,n8n_webhook:e.target.value}))}/></div>
          <button onClick={save} style={{...neu.primary,padding:"11px",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:12}}><Check size={13}/> Salvar</button>
        </div>
      </div>)}

      {tab==="ia"&&(<div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Sparkles size={17} style={{color:C.primary}}/><h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Integracao de IA</h3></div>
        <div>
          <label style={lbl}>Provedor</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {Object.entries(AI_PROVIDERS).map(([k,v])=><button key={k} onClick={()=>setCfg(c=>({...c,ai_provider:k,ai_model:v.models[0]||""}))} style={{...(provider===k?neu.active:neu.btn),padding:"9px 12px",color:provider===k?C.primary:C.muted,fontSize:12,fontWeight:provider===k?700:500,textAlign:"left"}}>{v.name}</button>)}
          </div>
        </div>
        <div><label style={lbl}>API Key — {pInfo?.name}</label><input style={inp} type="password" placeholder={pInfo?.placeholder||"sua-api-key"} value={cfg.ai_key||""} onChange={e=>setCfg(c=>({...c,ai_key:e.target.value}))}/>{pInfo?.link&&<p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Obter em: <a href={"https://"+pInfo.link} target="_blank" rel="noopener noreferrer" style={{color:C.primary}}>{pInfo.link}</a></p>}</div>
        {provider==="custom"&&<div><label style={lbl}>URL da API (OpenAI-compativel)</label><input style={inp} placeholder="https://sua-api.com/v1/chat/completions" value={cfg.ai_custom_url||""} onChange={e=>setCfg(c=>({...c,ai_custom_url:e.target.value}))}/></div>}
        <div><label style={lbl}>Modelo</label>{pInfo?.models?.length>0?<select style={{...inp,cursor:"pointer"}} value={cfg.ai_model||pInfo.models[0]} onChange={e=>setCfg(c=>({...c,ai_model:e.target.value}))}>{pInfo.models.map(m=><option key={m} value={m} style={{background:"#12192b"}}>{m}</option>)}</select>:<input style={inp} placeholder="nome-do-modelo" value={cfg.ai_model||""} onChange={e=>setCfg(c=>({...c,ai_model:e.target.value}))}/>}</div>
        <div><label style={lbl}>Instrucoes Personalizadas</label><textarea style={{...inp,minHeight:70,resize:"vertical"}} placeholder="Ex: Sempre use tom divertido. Foco em K-pop. Maximo 150 palavras." value={cfg.ai_prompt||""} onChange={e=>setCfg(c=>({...c,ai_prompt:e.target.value}))}/></div>
        <button onClick={save} style={{...neu.primary,padding:"12px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Sparkles size={14}/> Salvar IA</button>
      </div>)}

      {tab==="geral"&&(<div style={{...neu.flat,padding:28,display:"flex",flexDirection:"column",gap:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:C.onSurface,margin:0}}>Preferencias</h3>
        <div><label style={lbl}>Nome do App</label><input style={inp} placeholder="SocialHub" value={cfg.app_name||""} onChange={e=>setCfg(c=>({...c,app_name:e.target.value}))}/></div>
        <div><label style={lbl}>Hashtags Padrao</label><textarea style={{...inp,minHeight:70,resize:"vertical"}} placeholder="#kpop #kdrama #koreanculture" value={cfg.default_hashtags||""} onChange={e=>setCfg(c=>({...c,default_hashtags:e.target.value}))}/><p style={{fontSize:11,color:C.muted,margin:"4px 0 0"}}>Adicionadas ao final de todos os posts</p></div>
        <div><label style={lbl}>Fuso Horario</label><select style={{...inp,cursor:"pointer"}} value={cfg.timezone||"America/Sao_Paulo"} onChange={e=>setCfg(c=>({...c,timezone:e.target.value}))}>{["America/Sao_Paulo","America/Manaus","America/Fortaleza","America/Belem","America/Recife","America/Bahia"].map(t=><option key={t} value={t} style={{background:"#12192b"}}>{t}</option>)}</select></div>
        <button onClick={save} style={{...neu.primary,padding:"12px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Check size={14}/> Salvar</button>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:16}}><p style={{fontSize:13,color:C.error,fontWeight:700,margin:"0 0 10px"}}>Zona de Perigo</p><button onClick={()=>{if(confirm("Limpar TUDO?")){{localStorage.clear();window.location.reload();}}}} style={{...neu.btn,padding:"9px 16px",fontSize:13,color:C.error}}>Limpar tudo e reiniciar</button></div>
      </div>)}
    </div>
  );
}

function Dashboard({ posts, loading, onRefresh, onNav }) {
  const pend=posts.filter(p=>p.status==="pendente").length;const pub=posts.filter(p=>p.status==="publicado").length;const err=posts.filter(p=>p.status==="erro").length;
  const cfg=getConfig();
  return (<div style={{display:"flex",flexDirection:"column",gap:28}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><h2 style={{fontSize:30,fontWeight:700,color:C.onSurface,margin:0}}>{cfg.app_name||"SocialHub"}</h2><p style={{color:C.muted,fontSize:14,margin:"6px 0 0"}}>Painel de controle</p></div><button onClick={onRefresh} style={{...neu.btn,display:"flex",alignItems:"center",gap:7,padding:"9px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13} style={{animation:loading?"spin 1s linear infinite":"none"}}/> Atualizar</button></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>{[{I:List,l:"Total",v:posts.length,c:C.primary},{I:Clock,l:"Pendentes",v:pend,c:C.tertiary,s:"aguardando n8n"},{I:CheckCircle,l:"Publicados",v:pub,c:C.secondary},{I:XCircle,l:"Erros",v:err,c:C.error}].map(({I,l,v,c,s})=>(<div key={l} style={{...neu.flat,padding:22}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{l}</span><div style={{...neu.inset,padding:7}}><I size={15} style={{color:c}}/></div></div><div style={{fontSize:36,fontWeight:800,color:c,lineHeight:1}}>{v}</div>{s&&<p style={{fontSize:11,color:C.muted,marginTop:4}}>{s}</p>}</div>))}</div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
      <div style={{...neu.flat,overflow:"hidden"}}>
        <div style={{padding:"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,fontWeight:700,color:C.onSurface}}>Posts Recentes</span><span style={{fontSize:12,color:C.muted}}>{posts.length} total</span></div>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Loader2 size={26} style={{color:C.primary,animation:"spin 1s linear infinite"}}/></div>:posts.length===0?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 32px",gap:16}}><div style={{...neu.inset,width:68,height:68,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={30} style={{color:C.muted,opacity:0.5}}/></div><div style={{textAlign:"center"}}><h4 style={{color:C.onSurface,margin:"0 0 8px"}}>Nenhum post ainda</h4><p style={{color:C.muted,fontSize:14,maxWidth:260}}>Crie seu primeiro post para comecar.</p></div><button onClick={()=>onNav("novo")} style={{...neu.primary,padding:"11px 24px",fontSize:14}}>Criar Primeiro Post</button></div>):(
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{["","Legenda","Contas","Status","Quando"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}</tr></thead>
          <tbody>{posts.slice(0,8).map((p,i)=>{let c=[];try{c=typeof p.contas==="string"?JSON.parse(p.contas):(p.contas||[]);}catch{}return(<tr key={p.id} style={{borderBottom:i<7?"1px solid rgba(255,255,255,0.04)":"none"}}><td style={{padding:"11px 16px"}}>{p.tipo==="REELS"?<Film size={14} style={{color:"#a78bfa"}}/>:<Image size={14} style={{color:C.primary}}/>}</td><td style={{padding:"11px 16px",color:C.muted,fontSize:13,maxWidth:160}}><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.legenda||"—"}</span></td><td style={{padding:"11px 16px",color:C.muted,fontSize:12}}>{c.map(x=>x.conta||x).join(", ")||"—"}</td><td style={{padding:"11px 16px"}}>{sBadge(p.status)}</td><td style={{padding:"11px 16px",color:C.muted,fontSize:12}}>{p.postar_agora?<span style={{color:C.tertiary}}>imediato</span>:p.data_agendada?new Date(p.data_agendada).toLocaleString("pt-BR"):"—"}</td></tr>);})}</tbody></table>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{...neu.flat,padding:22}}><h4 style={{color:C.onSurface,fontWeight:700,margin:"0 0 14px",fontSize:15}}>Estatisticas</h4>{[{l:"Taxa de sucesso",v:posts.length>0?Math.round((pub/posts.length)*100)+"%":"—",c:C.secondary},{l:"Pendentes",v:pend,c:C.tertiary},{l:"Esta semana",v:posts.filter(p=>{try{return(new Date()-new Date(p.created_at))<7*86400000;}catch{return false;}}).length,c:C.primary}].map(({l,v,c})=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><span style={{fontSize:13,color:C.muted}}>{l}</span><span style={{fontSize:16,fontWeight:800,color:c}}>{v}</span></div>))}</div>
        <div style={{...neu.flat,padding:22,background:"linear-gradient(135deg,rgba(173,198,255,0.06),transparent)"}}><h4 style={{color:C.primary,fontWeight:700,margin:"0 0 10px",fontSize:14}}>Dica Pro</h4><p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:0}}>Reels entre 18h-21h geram mais alcance. Use IA para legendas com hashtags otimizadas.</p></div>
      </div>
    </div>
  </div>);
}

function Toast({ toast }) {
  if(!toast) return null;
  const colors={success:C.secondary,error:C.error,info:C.primary};
  return <div style={{position:"fixed",bottom:28,right:28,display:"flex",alignItems:"center",gap:12,padding:"13px 20px",background:"#1a2235",border:"1px solid "+colors[toast.type]+"40",borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:1000,maxWidth:340}}><div style={{width:26,height:26,borderRadius:"50%",background:colors[toast.type]+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>{toast.type==="success"?<Check size={12} style={{color:C.secondary}}/>:toast.type==="error"?<X size={12} style={{color:C.error}}/>:<Bell size={12} style={{color:C.primary}}/>}</div><span style={{fontSize:14,color:C.onSurface,fontWeight:500}}>{toast.message}</span></div>;
}

export default function App() {
  const [page,setPage]=useState("dashboard");
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState(null);const [accounts,setAccounts]=useState(getAccounts);
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
        const ltRes=await fetch("https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id="+appId+"&client_secret="+appSecret+"&fb_exchange_token="+shortToken);
        const ltData=await ltRes.json();if(ltData.error) throw new Error(ltData.error.message);
        const longToken=ltData.access_token;
        const pgRes=await fetch("https://graph.facebook.com/v18.0/me/accounts?access_token="+longToken);
        const pgData=await pgRes.json();if(pgData.error) throw new Error(pgData.error.message);
        const found=[];
        for(const page of (pgData.data||[])){
          const igRes=await fetch("https://graph.facebook.com/v18.0/"+page.id+"?fields=instagram_business_account&access_token="+page.access_token);
          const igData=await igRes.json();
          if(igData.instagram_business_account?.id){
            const igId=igData.instagram_business_account.id;
            const detRes=await fetch("https://graph.facebook.com/v18.0/"+igId+"?fields=username&access_token="+page.access_token);
            const det=await detRes.json();
            found.push({conta:det.username||page.name,token:page.access_token,ig_user_id:igId});
          }
        }
        if(found.length===0){showToast("Nenhuma conta Instagram Business encontrada. Verifique se e Business/Creator.","error");return;}
        const existing=getAccounts();const merged=[...existing];
        for(const a of found){if(!merged.find(x=>x.conta===a.conta)) merged.push(a);}
        setAccounts(merged);localStorage.setItem("socialhub_accounts",JSON.stringify(merged));
        showToast(found.length+" conta(s) conectada(s)!","success");setPage("settings");
      }catch(e){showToast("Erro no login: "+e.message,"error");}
      finally{setOauthLoading(false);}
    })();
  },[]);

  useEffect(()=>{loadPosts();},[loadPosts]);
  const handleDelete=async(id)=>{if(!confirm("Deletar?")) return;await makeApi().deletePost(id);setPosts(p=>p.filter(x=>x.id!==id));showToast("Deletado","success");};
  const pend=posts.filter(p=>p.status==="pendente").length;
  const nav=[{k:"dashboard",I:LayoutDashboard,l:"Dashboard"},{k:"novo",I:Plus,l:"Novo Post"},{k:"fila",I:List,l:"Fila"},{k:"settings",I:Settings,l:"Configuracoes"}];

  return (<>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#12192b;color:#dae2fd;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}input,textarea,button,select{font-family:inherit}a{text-decoration:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}`}</style>
    {oauthLoading&&<div style={{position:"fixed",inset:0,background:"rgba(10,15,26,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,flexDirection:"column",gap:16}}><Loader2 size={40} style={{color:C.primary,animation:"spin 1s linear infinite"}}/><p style={{color:C.onSurface,fontSize:16,fontWeight:600}}>Conectando suas contas Instagram...</p></div>}
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      <aside style={{width:240,background:"#0e1423",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",padding:"28px 0",flexShrink:0}}>
        <div style={{padding:"0 22px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><h1 style={{fontSize:22,fontWeight:800,color:C.primary,margin:0}}>{cfg.app_name||"SocialHub"}</h1><p style={{fontSize:10,color:C.muted,marginTop:3,fontFamily:"monospace"}}>Fullstek v3.0</p></div>
        <nav style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:5}}>{nav.map(({k,I,l})=>{const a=page===k;return(<button key={k} onClick={()=>setPage(k)} style={{...(a?neu.active:{}),display:"flex",alignItems:"center",gap:11,padding:"11px 13px",borderRadius:11,background:a?"#12192b":"transparent",border:a?"1px solid rgba(173,198,255,0.2)":"1px solid transparent",color:a?C.primary:C.muted,cursor:"pointer",fontSize:14,fontWeight:a?700:400,textAlign:"left",width:"100%",transition:"all 0.15s"}}><I size={17}/>{l}{k==="fila"&&pend>0&&<span style={{marginLeft:"auto",background:C.tertiary,color:"#2a1700",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:800}}>{pend}</span>}</button>);})}</nav>
        <div style={{padding:"14px 14px 0"}}><div style={{...neu.inset,display:"flex",alignItems:"center",gap:9,padding:"9px 13px",borderRadius:12}}><div style={{width:7,height:7,borderRadius:"50%",background:C.secondary,boxShadow:"0 0 8px "+C.secondary}}/><span style={{fontSize:12,color:C.secondary,fontWeight:600}}>n8n ativo</span></div></div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{background:"rgba(18,25,43,0.85)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}><span style={{fontSize:13,color:C.muted}}>{accounts.length} conta{accounts.length!==1?"s":""} conectada{accounts.length!==1?"s":""}</span><button onClick={loadPosts} style={{...neu.btn,display:"flex",alignItems:"center",gap:7,padding:"8px 16px",color:C.muted,fontSize:13}}><RefreshCw size={13}/> Sincronizar</button></header>
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
