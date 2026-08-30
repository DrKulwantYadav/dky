"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function SetupPasswordPage() {
  const [ready,setReady]=useState(false),[message,setMessage]=useState("");const supabase=useMemo(()=>createClient(),[]);
  useEffect(()=>{
    let active=true;
    async function acceptRecovery(){
      setMessage("");
      const query=new URLSearchParams(window.location.search);
      const code=query.get("code");
      if(code){
        const{error}=await supabase.auth.exchangeCodeForSession(code);
        if(error&&active)setMessage("This recovery link is invalid or expired. Please request a new one.");
      }
      const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
      const accessToken=hash.get("access_token"),refreshToken=hash.get("refresh_token");
      if(accessToken&&refreshToken){
        const{error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
        if(error&&active)setMessage("This recovery link is invalid or expired. Please request a new one.");
      }
      const{data}=await supabase.auth.getSession();
      if(active)setReady(Boolean(data.session));
    }
    const{data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(active&&session)setReady(true)});
    acceptRecovery();
    return()=>{active=false;listener.subscription.unsubscribe()};
  },[supabase]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget),password=String(form.get("password")||""),confirm=String(form.get("confirm")||"");if(password.length<10)return setMessage("Use at least 10 characters.");if(password!==confirm)return setMessage("Passwords do not match.");const{error}=await supabase.auth.updateUser({password});if(error)return setMessage(error.message);window.location.replace("/admin")}
  return <main className="admin-login-page"><section className="admin-login-card"><div className="admin-brand-mark">GY</div><p className="admin-eyebrow">Secure Admin access</p><h1>Create your password</h1><p>Set a secure password for the Gopinath Hospital Admin CRM.</p>{message&&<div className="admin-alert error">{message}</div>}{ready?<form className="admin-form" onSubmit={submit}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} required/></label><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" minLength={10} required/></label><button className="admin-primary-button">Save password and continue</button></form>:!message&&<div className="admin-alert">Checking your secure recovery link…</div>}</section></main>
}
