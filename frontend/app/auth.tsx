"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Mail, LockKeyhole, UserRound, Eye, EyeOff, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { api, type User } from "@/lib/api";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [show,setShow] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (signup && password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const data = await api<{access_token:string;user:User}>(signup?"/api/auth/signup":"/api/auth/login", {method:"POST", body:JSON.stringify(signup?{name,email,password}:{email,password})}, false);
      localStorage.setItem("uta_token",data.access_token);
      router.replace("/");
    } catch(e) { setError(e instanceof Error ? e.message : "Could not authenticate."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="auth-card"><aside className="auth-brand-panel"><Link className="brand auth-brand" href="/"><span className="brand-mark"><ShieldCheck size={26}/></span><span><b>URL Threat Analyzer</b><small>Safer links. Safer you.</small></span></Link><div className="auth-pitch"><span className="eyebrow">BROWSE WITH CONFIDENCE</span><h1>{signup?"Make safer clicks a habit.":"Welcome back."}</h1><p>{signup?"Create an account to analyze links and keep your scan history private.":"Log in to continue checking links and reviewing your private scan history."}</p><div className="auth-feature"><CheckCircle2 size={17}/> Clear, explainable scan results</div><div className="auth-feature"><CheckCircle2 size={17}/> Your own private scan history</div><div className="auth-feature"><CheckCircle2 size={17}/> Simple risk indicators</div></div><div className="auth-art"><div className="auth-orbit"/><div className="auth-shield"><Shield size={75}/></div><span className="auth-art-dot one"/><span className="auth-art-dot two"/></div><small className="auth-foot">URL security insights, made understandable.</small></aside><section className="auth-form-panel"><div className="mobile-brand"><ShieldCheck size={25}/> URL Threat Analyzer</div><span className="eyebrow">{signup?"GET STARTED":"ACCOUNT ACCESS"}</span><h2>{signup?"Create your account":"Log in"}</h2><p className="form-intro">{signup?"A few details and you’re ready to go.":"Enter your details to access your dashboard."}</p><form onSubmit={submit} className="auth-form">{signup&&<label>Full name<div className="field"><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required minLength={2} maxLength={100}/></div></label>}<label>Email address<div className="field"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></div></label><label>Password<div className="field"><LockKeyhole size={18}/><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={signup?"At least 8 characters":"Your password"} required minLength={signup?8:1} maxLength={128} autoComplete={signup?"new-password":"current-password"}/><button type="button" className="reveal" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>{signup&&<label>Confirm password<div className="field"><LockKeyhole size={18}/><input type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter your password" required minLength={8} maxLength={128} autoComplete="new-password"/></div></label>}{error&&<p className="error-message" role="alert">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy?"Please wait…":signup?"Create account":"Log in"} <ArrowRight size={18}/></button></form><p className="auth-switch">{signup?"Already have an account?":"New to URL Threat Analyzer?"} <Link href={signup?"/login":"/signup"}>{signup?"Log in":"Create an account"}</Link></p><div className="privacy-note"><ShieldCheck size={16}/> Your scan history is tied to your account.</div></section></section><p className="auth-disclaimer">This prototype uses URL heuristics and does not guarantee website safety.</p></main>;
}
