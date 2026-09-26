import React, { useEffect, useState } from "react";

export default function AdminInstallButton(){
  const [event,setEvent]=useState<any>(null);
  const [installed,setInstalled]=useState(false);
  useEffect(()=>{
    const standalone=window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(standalone);
    const onBefore=(e:any)=>{e.preventDefault();setEvent(e)};
    const onInstalled=()=>{setInstalled(true);setEvent(null)};
    window.addEventListener("beforeinstallprompt",onBefore);
    window.addEventListener("appinstalled",onInstalled);
    return()=>{window.removeEventListener("beforeinstallprompt",onBefore);window.removeEventListener("appinstalled",onInstalled)};
  },[]);
  if(installed || !event) return null;
  return <button type="button" className="admin-install-btn" onClick={async()=>{event.prompt();try{await event.userChoice}catch{}setEvent(null)}}>Install Admin App</button>;
}
