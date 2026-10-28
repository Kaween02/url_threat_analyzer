"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Link2, Search, Clock3, Info, Home, LogOut, Trash2, AlertTriangle, ShieldAlert, CheckCircle2, CircleAlert, Lightbulb, Activity, UserRound } from "lucide-react";
import { api, token, type Scan, type User } from "@/lib/api";

const levels = [
  { title: "High Risk", color: "red", text: "Strong warning signs. Avoid opening this link.", icon: ShieldAlert },
  { title: "Suspicious", color: "amber", text: "Several warning signs. Verify it independently.", icon: CircleAlert },
  { title: "Low Risk", color: "blue", text: "A few concerns were found. Proceed carefully.", icon: Info },
  { title: "Safe", color: "green", text: "No known warning signs matched. Not a guarantee.", icon: ShieldCheck },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Scan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"Home"|"History"|"About">("Home");

  useEffect(() => {
    if (!token()) { router.replace("/login"); return; }
    api<User>("/api/auth/me").then(setUser).catch(() => { localStorage.removeItem("uta_token"); router.replace("/login"); });
    loadHistory();
  }, [router]);

  async function loadHistory() {
    try { setScans(await api<Scan[]>("/api/scans")); } catch (e) { setError(e instanceof Error ? e.message : "Could not load history."); }
  }
  async function analyze(e: React.FormEvent) {
    e.preventDefault(); setError(""); setResult(null);
    if (!url.trim()) { setError("Paste a URL to analyze first."); return; }
    setBusy(true);
    try { const item = await api<Scan>("/api/scans", { method: "POST", body: JSON.stringify({ url: url.trim() }) }); setResult(item); setScans(old => [item, ...old.filter(s => s.id !== item.id)]); }
    catch (e) { setError(e instanceof Error ? e.message : "Analysis failed."); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    try { await api(`/api/scans/${id}`, { method: "DELETE" }); setScans(old => old.filter(s => s.id !== id)); if (result?.id === id) setResult(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete scan."); }
  }
  async function clearHistory() {
    if (!confirm("Clear your entire scan history? This cannot be undone.")) return;
    try { await api("/api/scans", { method: "DELETE" }); setScans([]); setResult(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not clear history."); }
  }
  function logout() { localStorage.removeItem("uta_token"); router.replace("/login"); }

  const counts = levels.map(level => ({ ...level, count: scans.filter(s => s.risk === level.title).length }));
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="/"><span className="brand-mark"><ShieldCheck size={25}/></span><span><b>URL Threat Analyzer</b><small>Safer links. Safer you.</small></span></a>
      <nav className="topnav">{(["Home","History","About"] as const).map((item,i) => <button key={item} className={view===item?"nav-item active":"nav-item"} onClick={()=>setView(item)}>{i===0?<Home size={17}/>:i===1?<Clock3 size={17}/>:<Info size={17}/>} {item}</button>)}</nav>
      <div className="user-area"><span className="avatar"><UserRound size={18}/></span><span className="user-name">{user?.name || "Account"}</span><button className="icon-button" onClick={logout} title="Log out"><LogOut size={17}/></button></div>
    </header>
    <div className="layout">
      <aside className="sidebar"><div className="side-links">{(["Home","History","About"] as const).map((item,i)=><button key={item} className={view===item?"side-link selected":"side-link"} onClick={()=>setView(item)}>{i===0?<Home size={18}/>:i===1?<Clock3 size={18}/>:<Info size={18}/>} {item}</button>)}</div><div className="sidebar-bottom"><div className="side-shield"><ShieldCheck size={30}/></div><b>Your security matters</b><span>Check first. Click with confidence.</span></div></aside>
      <section className="content">
        {view==="About" ? <section className="panel about-panel"><span className="eyebrow">ABOUT THIS TOOL</span><h1>Understand links before you open them.</h1><p>URL Threat Analyzer checks a URL for common warning signs and explains what it found in plain language.</p><div className="notice"><Info size={19}/><span>This build uses simple URL heuristics. It is not yet connected to a trained machine-learning model or live threat-intelligence provider. A Safe result is not a guarantee.</span></div></section> :
        <>
        <section className="scanner panel">
          <div className="scanner-copy"><span className="eyebrow"><Activity size={14}/> URL SECURITY CHECK</span><h1>Check if a link is safe</h1><p>Paste a link below to check for common phishing warning signs.</p>
            <form className="scan-form" onSubmit={analyze}><div className="url-input"><Link2 size={21}/><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a URL (e.g. https://example.com)" aria-label="URL to analyze" /></div><button className="primary-button" disabled={busy}>{busy?<span className="spinner"/>:<Search size={19}/>} {busy?"Analyzing…":"Analyze"} {!busy&&<span>›</span>}</button></form>
            {error&&<p className="error-message" role="alert">{error}</p>}
          </div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-shield"><ShieldCheck size={67}/></div><div className="orbit-dot dot-one"/><div className="orbit-dot dot-two"/><span className="art-tag tag-one">URL SCAN</span><span className="art-tag tag-two">THREAT CHECK</span></div>
        </section>
        <section className="risk-grid">{counts.map(({title,color,text,icon:Icon,count})=><article className={`risk-card ${color}`} key={title}><div className="risk-icon"><Icon size={24}/></div><div className="risk-copy"><h3>{title}</h3><p>{text}</p></div><div className="risk-count"><b>{count}</b><span>scans</span></div></article>)}</section>
        {result&&<section className={`result-panel panel ${riskClass(result.risk)}`}><div className="result-heading"><div><span className="eyebrow">LATEST RESULT</span><h2>{result.risk} <span className="score">Score {result.score}/100</span></h2></div><button className="secondary-button" onClick={()=>setResult(null)}>Dismiss</button></div><p>{result.explanation}</p><ul className="indicator-list">{result.indicators.map((item,i)=><li key={i}><span className="bullet"/>{item}</li>)}</ul><small>Prototype heuristic result · No live reputation check performed</small></section>}
        <section className="lower-grid">
          <article className="panel history-panel" id="history"><div className="section-heading"><div><Clock3 size={21}/><h2>{view==="History"?"Your Scan History":"Recent Analysis"}</h2></div><button className="secondary-button" onClick={clearHistory} disabled={!scans.length}><Trash2 size={15}/> Clear all</button></div>
            {scans.length===0?<div className="empty-state"><div><Link2 size={24}/></div><b>No scans yet</b><span>Your analyzed links will appear here.</span></div>:<div className="table-wrap"><table><thead><tr><th>URL</th><th>Result</th><th>Analyzed</th><th></th></tr></thead><tbody>{scans.map(scan=><tr key={scan.id}><td className="url-cell" title={scan.url}><Link2 size={15}/><span>{scan.url}</span></td><td><span className={`status-pill ${riskClass(scan.risk)}`}>{scan.risk}</span></td><td className="date-cell">{new Date(scan.created_at).toLocaleString()}</td><td><button className="clear-row" onClick={()=>remove(scan.id)} aria-label={`Delete scan for ${scan.url}`}><Trash2 size={14}/> Clear</button></td></tr>)}</tbody></table></div>}
          </article>
          <article className="panel explain-panel"><div className="section-heading"><div><Lightbulb size={22}/><h2>Understanding results</h2></div></div><div className="explain-list">{levels.map(({title,color,text,icon:Icon})=><div className={`explain-item ${color}`} key={title}><div className="explain-icon"><Icon size={20}/></div><div><b>{title}</b><p>{title==="High Risk"?"Strong warning signs were found. Do not open unless independently verified.":title==="Suspicious"?"Some signals may indicate a lure or misleading destination. Verify it through an official channel.":title==="Low Risk"?"A few unusual patterns were detected. Check the address carefully.":"No warning signs matched this basic check. Unknown threats may still exist."}</p></div></div>)}</div><div className="notice"><Info size={17}/><span>A Safe result does not guarantee a website is harmless.</span></div></article>
        </section></>}
      </section>
    </div>
  </main>;
}
function riskClass(risk: string) { return risk.toLowerCase().replace(" ", "-"); }
