import Link from 'next/link'
import CotizadorCRM from '@/components/Cotizador'

export default function HomePage() {
  return (
    <div style={{minHeight:'100vh',background:'#040f0a',display:'flex',flexDirection:'column',fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:'#fff',overflowX:'hidden'}}>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 40px',background:'rgba(4,15,10,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,fontWeight:800,fontSize:'1.2rem'}}>
          <div style={{width:30,height:30,background:'#10b981',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" width="15" height="15"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          {'TuAgent'}<span style={{color:'#10b981'}}>X</span>
          <span style={{fontSize:'.65rem',fontWeight:600,color:'#10b981',background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.25)',padding:'2px 8px',borderRadius:6,marginLeft:4}}>CRM</span>
        </div>
        <Link href="/login" style={{background:'#10b981',color:'#000',fontWeight:700,padding:'8px 20px',borderRadius:8,textDecoration:'none',fontSize:'.85rem'}}>Ingresar →</Link>
      </nav>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'100px 24px 60px',minHeight:'100vh',background:'radial-gradient(ellipse at 30% 50%, rgba(16,185,129,.15) 0%, transparent 60%)'}}>
        <div style={{maxWidth:520,width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:20,textAlign:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.22)',borderRadius:16,padding:'4px 14px',fontSize:'.68rem',fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#10b981'}}>🤖 CRM WhatsApp con IA</div>
          <h1 style={{fontSize:'clamp(2rem,5vw,3rem)',fontWeight:800,lineHeight:1.12,letterSpacing:-.5,margin:0}}>Vende con IA<br/><span style={{color:'#10b981'}}>24/7 en WhatsApp</span></h1>
          <p style={{color:'#9ca3af',fontSize:'clamp(.9rem,2vw,1.05rem)',lineHeight:1.65,maxWidth:420,margin:0}}>Tu agente atiende, asesora y cierra ventas automáticamente. Sin código. Configúralo en minutos con tu catálogo real.</p>
          <div style={{width:'100%',maxWidth:340,background:'#111',borderRadius:16,border:'1px solid rgba(255,255,255,.07)',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.7)'}}>
            <div style={{background:'#162318',padding:'10px 12px',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid rgba(255,255,255,.05)'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>🤖</div>
              <div><div style={{fontSize:'.75rem',fontWeight:700}}>{'Sofía · TuAgentX'}</div><div style={{fontSize:'.6rem',color:'#10b981'}}>● En línea</div></div>
              <div style={{marginLeft:'auto',background:'#162318',border:'1px solid rgba(16,185,129,.25)',borderRadius:8,padding:'4px 10px',display:'flex',gap:5,alignItems:'center'}}>
                <span style={{fontSize:'.95rem',fontWeight:800,color:'#10b981'}}>+47</span>
                <span style={{fontSize:'.58rem',color:'#9ca3af',lineHeight:1.2}}>ventas<br/>hoy</span>
                <span style={{fontSize:'1rem'}}>💰</span>
              </div>
            </div>
            <div id="chatMsgs" style={{height:200,padding:10,display:'flex',flexDirection:'column',gap:6,overflow:'hidden',position:'relative'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:50,background:'linear-gradient(to bottom,#111,transparent)',zIndex:5,pointerEvents:'none'}}></div>
              <div id="typer" style={{display:'flex',alignItems:'center',gap:3,padding:'6px 8px',background:'#1e1e1e',borderRadius:'8px 8px 8px 2px',width:'fit-content',opacity:0,transition:'opacity .2s',flexShrink:0}}>
                <div className="td"></div><div className="td"></div><div className="td"></div>
              </div>
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',gap:5,background:'#0d0d0d'}}>
              <div style={{flex:1,background:'#1a1a1a',borderRadius:10,padding:'5px 8px',fontSize:'.62rem',color:'rgba(255,255,255,.2)'}}>Escribe un mensaje...</div>
              <div style={{width:20,height:20,background:'#10b981',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',maxWidth:400}}>
            {[['🤖','Agente IA','GPT-4 con tu catálogo'],['📦','Inventario','Stock con alertas'],['🛍️','Ventas CRM','Pipeline completo'],['📣','Publicaciones','Estados WhatsApp IA'],['💰','Finanzas','Márgenes y costos'],['🚀','Crecer IA','Tendencias de nicho']].map(([ico,name,desc])=>(
              <div key={name} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',borderRadius:10,padding:'12px 14px',textAlign:'left'}}>
                <div style={{fontSize:'1.1rem',marginBottom:5}}>{ico}</div>
                <div style={{fontSize:'.78rem',fontWeight:600,marginBottom:2}}>{name}</div>
                <div style={{fontSize:'.7rem',color:'#9ca3af',lineHeight:1.3}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',width:'100%',maxWidth:400}}>
            <Link href="/login" style={{flex:1,minWidth:160,background:'#10b981',color:'#000',fontWeight:700,padding:'14px 24px',borderRadius:10,textDecoration:'none',fontSize:'.95rem',textAlign:'center',boxShadow:'0 0 24px rgba(16,185,129,.3)'}}>Ingresar al CRM →</Link>
            <Link href="/demo" style={{flex:1,minWidth:160,background:'transparent',color:'#10b981',border:'1px solid rgba(16,185,129,.3)',fontWeight:700,padding:'14px 24px',borderRadius:10,textDecoration:'none',fontSize:'.95rem',textAlign:'center'}}>⚡ Ver demo gratis</Link>
          </div>
          <p style={{fontSize:'.72rem',color:'#6b7280'}}>✓ Sin contrato · ✓ Cancela cuando quieras · ✓ Soporte en español</p>
        </div>
      </div>
      <div style={{background:'rgba(0,0,0,.3)',padding:'72px 24px',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:860,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:36}}>
            <div style={{fontSize:'.68rem',fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'#10b981',marginBottom:6}}>Planes CRM</div>
            <div style={{fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:800}}>Simple. Sin sorpresas.</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
            {[{name:'Básico',price:'$149.000',perks:['1 agente WhatsApp','CRM completo','Inventario','Soporte'],pop:false},{name:'Pro',price:'$249.000',perks:['2 agentes WhatsApp','Finanzas + Crecer IA','Publicaciones auto','Soporte prioritario'],pop:true},{name:'Business',price:'$399.000',perks:['3 agentes WhatsApp','Multi-agente por número','Soporte VIP','Onboarding dedicado'],pop:false}].map(p=>(
              <div key={p.name} style={{background:p.pop?'rgba(16,185,129,.05)':'rgba(255,255,255,.025)',border:p.pop?'1px solid rgba(16,185,129,.3)':'1px solid rgba(255,255,255,.06)',borderRadius:14,padding:'22px 20px',position:'relative'}}>
                {p.pop&&<div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'#10b981',color:'#000',fontSize:'.64rem',fontWeight:700,padding:'2px 12px',borderRadius:8,whiteSpace:'nowrap'}}>⭐ Más popular</div>}
                <div style={{fontSize:'.7rem',color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{p.name}</div>
                <div style={{fontSize:'1.4rem',fontWeight:800,marginBottom:14}}>{p.price}<span style={{fontSize:'.74rem',fontWeight:400,color:'#9ca3af'}}>/mes</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:18}}>{p.perks.map(pk=><div key={pk} style={{fontSize:'.75rem',color:'rgba(255,255,255,.65)',display:'flex',gap:6}}><span style={{color:'#10b981'}}>✓</span>{pk}</div>)}</div>
                <Link href="/login" style={{display:'block',width:'100%',padding:'9px',borderRadius:8,background:p.pop?'#10b981':'transparent',color:p.pop?'#000':'#10b981',border:p.pop?'none':'1px solid rgba(16,185,129,.3)',fontWeight:700,fontSize:'.8rem',textAlign:'center',textDecoration:'none',boxSizing:'border-box'}}>Empezar</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CotizadorCRM />
      <footer style={{background:'#07070a',padding:'24px 40px',borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{fontWeight:800,fontSize:'.95rem'}}>{'TuAgent'}<span style={{color:'#10b981'}}>X</span> <span style={{fontSize:'.65rem',color:'#10b981',fontWeight:600}}>CRM</span></div>
        <div style={{color:'#6b7280',fontSize:'.75rem'}}>© 2026 TuAgentX · Colombia</div>
      </footer>
      <style>{`.td{width:4px;height:4px;background:#10b981;border-radius:50%;animation:tda 1s infinite;display:inline-block}.td:nth-child(2){animation-delay:.15s}.td:nth-child(3){animation-delay:.3s}@keyframes tda{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
      <script dangerouslySetInnerHTML={{__html:`const conv=[{t:'in',x:'Hola, tienen crema SPF50?'},{t:'out',x:'Hola! Soy Sofia 😊 Si, Crema Solar SPF50 a $44.500. La quieres?'},{t:'in',x:'Cuanto es el envio?'},{t:'out',x:'Gratis en compras +$80.000! Llevando 2 = $89.000 envio incluido.'},{t:'in',x:'Perfecto, las quiero'},{t:'out',x:'Genial! Dame tu nombre y direccion 📦'},{t:'in',x:'Ana Garcia, Calle 45 Bogota'},{t:'win',x:'🎉 Venta concretada\\n✅ Pedido AN-0089\\n💰 $89.000 · Envio gratis'}];let ci=0;const box=document.getElementById('chatMsgs');const typer=document.getElementById('typer');function addBub(item){const all=box.querySelectorAll('.bub');all.forEach((b,i)=>{b.style.opacity=Math.max(0.07,1-(all.length-i)*0.2)});const d=document.createElement('div');d.className='bub';d.style.cssText='opacity:0;transition:opacity .4s ease;max-width:88%;padding:7px 10px;border-radius:10px;font-size:.78rem;line-height:1.5;flex-shrink:0;font-family:-apple-system,sans-serif;'+(item.t==='win'?'background:linear-gradient(135deg,rgba(16,185,129,.22),rgba(16,185,129,.08));border:1px solid rgba(16,185,129,.32);color:#fff;align-self:center;text-align:center;font-weight:700;white-space:pre-line;':item.t==='out'?'background:#0b4d2e;color:#fff;border-radius:10px 10px 2px 10px;align-self:flex-end;':'background:#1e1e1e;color:rgba(255,255,255,.85);border-radius:10px 10px 10px 2px;align-self:flex-start;');const h=new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});d.innerHTML=item.x+(item.t!=='win'?'<div style="font-size:.55rem;color:rgba(255,255,255,.22);margin-top:2px;text-align:right">'+h+'</div>':'');box.insertBefore(d,typer);requestAnimationFrame(()=>{d.style.opacity='1'});box.scrollTop=box.scrollHeight}function step(){if(ci>=conv.length){setTimeout(()=>{box.querySelectorAll('.bub').forEach(b=>b.remove());ci=0;setTimeout(step,900)},5500);return}const item=conv[ci];if(item.t==='out'||item.t==='win'){typer.style.opacity='1';setTimeout(()=>{typer.style.opacity='0';addBub(item);ci++;setTimeout(step,item.t==='win'?5500:1000)},1100)}else{addBub(item);ci++;setTimeout(step,800)}}setTimeout(step,800);`}}/>
    </div>
  )
}
