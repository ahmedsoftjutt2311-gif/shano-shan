import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { PAKISTAN_CITIES, PAKISTAN_PROVINCES } from "./pakistanLocations";

const API =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

const logo = "/shanoshan.png";
const logoMark = "/shanoshan-mark.png";
const introVideo = "/videos/shano_shan_intro.mp4";
let customerLoadingCount = 0;
function setCustomerLoading(delta:number){ customerLoadingCount=Math.max(0,customerLoadingCount+delta); window.dispatchEvent(new CustomEvent("ss-loading",{detail:customerLoadingCount})); }

type Product = any;

type CtxType = {
  cart: any;
  refreshCart: () => Promise<void>;
  addToCart: (
    p: any,
    q?: number,
    variantId?: number
  ) => Promise<void>;
  user: any;
  setUser: any;
  toast: (s: string) => void;
};

const Ctx = createContext<CtxType>({} as CtxType);

const useStore = () => useContext(Ctx);

async function api(path: string, opt: any = {}) {
  const token = localStorage.getItem("ss_customer_token");

  const headers: any = {
    ...(opt.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(opt.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let r: Response;
  setCustomerLoading(1);
  try {
    r = await fetch(API + path, {
      ...opt,
      headers,
    });
  } catch {
    throw new Error("Unable to connect to SHANO SHAN.");
  } finally {
    setCustomerLoading(-1);
  }

  const d = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(d.error || "Request failed");
  }

  return d;
}

const money = (n: any) =>
  `PKR ${Number(n || 0).toLocaleString()}`;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* =========================================================
   APP
========================================================= */

function App() {
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<any>({ items: [] });
  const [toast, setToast] = useState("");
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(()=>{
    const onLoading=(e:any)=>setGlobalLoading(Number(e.detail||0)>0);
    window.addEventListener("ss-loading",onLoading as EventListener);
    return ()=>window.removeEventListener("ss-loading",onLoading as EventListener);
  },[]);

  /*
   * IMPORTANT:
   * This is true only when the React application initially loads.
   *
   * We DO NOT reload the page when changing hash routes.
   * Therefore the intro will not replay when navigating around
   * the website.
   */
  const [intro, setIntro] = useState(true);

  /*
   * Track the current hash route inside React.
   * This replaces the old:
   *
   * window.addEventListener("hashchange",()=>location.reload());
   *
   * which was causing the intro to replay.
   */
  const [route, setRoute] = useState(
    window.location.hash || "#/"
  );

  const [site, setSite] = useState<any>({
    settings: {},
    announcements: [],
  });

  const [home, setHome] = useState<any>({
    banners: [],
    sections: [],
  });

  /* =======================================================
     ROUTE CHANGE LISTENER
  ======================================================= */

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || "#/");
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  /* =======================================================
     INITIAL DATA
  ======================================================= */

  const refreshCart = async () => {
    try {
      setCart((await api("/api/cart")).cart);
    } catch {
      // Ignore cart errors while loading
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const m = await api("/api/auth/me");
        setUser(m.user);
      } catch {
        // Not logged in
      }

      await refreshCart();

      try {
        setSite(await api("/api/settings/site"));
      } catch {
        // Keep defaults
      }

      try {
        setHome(await api("/api/homepage"));
      } catch {
        // Keep defaults
      }
    })();
  }, []);

  /* =======================================================
     TOAST
  ======================================================= */

  useEffect(() => {
    if (!toast) return;

    const t = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(t);
  }, [toast]);

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart = async (
    p: any,
    q = 1,
    variantId?: number
  ) => {
    try {
      await api("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: p.id,
          quantity: q,
          variant_id: variantId,
        }),
      });

      await refreshCart();

      setToast("Added to your bag");
    } catch (e: any) {
      setToast(e.message);
    }
  };

  const value = {
    cart,
    refreshCart,
    addToCart,
    user,
    setUser,
    toast: (s: string) => setToast(s),
  };

  return (
    <Ctx.Provider value={value}>
      {/* =================================================
          INTRO
          Video ONLY.
          No logo overlay.
      ================================================= */}

      {intro && (
        <Intro
          onDone={() => {
            setIntro(false);
          }}
        />
      )}

      {site.announcements?.length > 0 && (
        <Announcement items={site.announcements} />
      )}

      <Header site={site} />

      <main>
        {renderRoute({
          site,
          home,
          route,
        })}
      </main>

      <Footer site={site} />
      <ShanoAIWidget />
      {globalLoading && <BrandLoadingOverlay />}

      {toast && <div className="toast">{toast}</div>}
    </Ctx.Provider>
  );
}

function BrandLoadingOverlay(){
  return <div className="brand-loading" role="status" aria-live="polite">
    <img className="loading-mark" src={logoMark} alt="SHANO SHAN"/>
  </div>;
}

/* =========================================================
   INTRO
========================================================= */

function Intro({
  onDone,
}: {
  onDone: () => void;
}) {
  const [show, setShow] = useState(true);

  const done = () => {
    if (!show) return;

    setShow(false);

    /*
     * Let the fade-out animation finish before removing
     * the intro from the UI.
     */
    setTimeout(() => {
      onDone();
    }, 550);
  };

  return (
    <div
      className={`intro ${
        show ? "" : "intro-out"
      }`}
    >
      {/*
        IMPORTANT:
        There is intentionally NO logo here.

        Your MP4 already contains:
        video → logo → fade → Home

        So we only display the video.
      */}

      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={done}
        src={introVideo}
      />

      <div className="intro-shade" />

      <button
        className="skip"
        onClick={done}
        type="button"
      >
        Skip intro
      </button>
    </div>
  );
}

/* =========================================================
   HEADER + ICONS
========================================================= */

function Icon({name,size=20}:{name:string;size?:number}){
  const common={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,ariaHidden:true};
  const paths:any={
    search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></>,
    user:<><circle cx="12" cy="8" r="3.2"/><path d="M5 20c.9-3.3 3.2-5 7-5s6.1 1.7 7 5"/></>,
    cart:<><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    close:<><path d="M6 6l12 12M18 6 6 18"/></>,
    chevronLeft:<path d="m15 18-6-6 6-6"/>,
    chevronRight:<path d="m9 18 6-6-6-6"/>,
    robot:<><rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 4v3M9 12h.01M15 12h.01M8 18v2M16 18v2M3 11v4M21 11v4"/><path d="M9 15c1.8 1 4.2 1 6 0"/></>,
    instagram:<><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></>,
    facebook:<><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1z" fill="currentColor" stroke="none"/></>,
    tiktok:<><path d="M14 4v10.1a4.1 4.1 0 1 1-3-4V6.2c3.1 2.2 5.3 2.3 7 2.3V5.2c-1.5-.1-3.1-.7-4-1.2z" fill="currentColor" stroke="none"/></>,
    youtube:<><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/></>,
    whatsapp:<><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.6-4.1A8 8 0 1 1 20 11.5z"/><path d="M9.1 8.4c.2-.4.5-.5.8-.5h.6c.2 0 .4.1.5.4l.6 1.4c.1.2.1.4-.1.6l-.6.6c.7 1.2 1.6 2 2.8 2.7l.6-.6c.2-.2.4-.2.6-.1l1.4.6c.3.1.4.3.4.5v.6c0 .3-.2.6-.5.8-.4.3-1 .4-1.5.3-3.1-.7-6-3.6-6.7-6.7-.1-.5 0-1.1.3-1.5z"/></>,
    mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    phone:<><path d="M6.5 3.8 9 3l2 4-2 1.7a13 13 0 0 0 6.3 6.3L17 13l4 2-.8 2.5c-.3.9-1.1 1.5-2 1.5C10.8 19 5 13.2 5 6c0-1 .6-1.8 1.5-2.2z"/></>,
    globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3z"/></>,
    bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    filter:<><path d="M4 6h16M7 12h10M10 18h4"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function SearchPanel({onClose}:{onClose:()=>void}){
  const [q,setQ]=useState("");
  const [results,setResults]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    const term=q.trim();
    if(!term){setResults([]);return;}
    const t=setTimeout(async()=>{
      setLoading(true);
      try{const x=await api(`/api/products?q=${encodeURIComponent(term)}&limit=8`);setResults(x.products||[])}catch{setResults([])}finally{setLoading(false)}
    },260);
    return()=>clearTimeout(t);
  },[q]);
  return <div className="search-overlay" role="dialog" aria-modal="true">
    <button className="search-backdrop" onClick={onClose} aria-label="Close search" />
    <div className="search-panel">
      <div className="search-head"><div><span className="eyebrow">SHANO SHAN</span><h2>Find your fragrance</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close search"><Icon name="close"/></button></div>
      <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search product, fragrance or notes…" />
      <div className="search-results">{loading&&<p className="muted">Searching the catalog…</p>}{!loading&&q&&results.length===0&&<p className="muted">No matching fragrances found.</p>}{results.map(p=><button className="search-result" key={p.id} onClick={()=>{location.hash=`#/product/${p.slug}`;onClose()}}><span className="search-result-image">{p.image_url&&<img src={p.image_url} alt=""/>}</span><span><b>{p.name}</b><small>{p.category_name||p.gender||"Signature fragrance"}</small></span><strong>{money(p.sale_price??p.price)}</strong></button>)}</div>
    </div>
  </div>;
}

function usePwaInstall(){const[deferred,setDeferred]=useState<any>(null);const[installed,setInstalled]=useState(()=>{try{return window.matchMedia('(display-mode: standalone)').matches||localStorage.getItem('ss_pwa_installed')==='1'}catch{return false}});useEffect(()=>{const before=(e:any)=>{e.preventDefault();setDeferred(e)};const done=()=>{setInstalled(true);setDeferred(null);try{localStorage.setItem('ss_pwa_installed','1')}catch{}};window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done)}},[]);const install=async()=>{if(!deferred)return;deferred.prompt();try{await deferred.userChoice}catch{}setDeferred(null)};return{canInstall:!!deferred&&!installed,install}}

function Header({ site }: { site: any }) {
  const { cart, user, setUser } = useStore();
  const {canInstall,install}=usePwaInstall();
  const [open, setOpen] = useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [unread,setUnread]=useState(0);
  const [noticeOpen,setNoticeOpen]=useState(false);
  const nav = (p: string) => { window.location.hash = p; setOpen(false); };
  const logout = async () => { try { await api("/api/auth/logout", { method: "POST" }); } catch {} localStorage.removeItem("ss_customer_token"); setUser(null); nav("#/"); };
  const count=cart.items?.reduce((n:any,i:any)=>n+Number(i.quantity),0)||0;
  useEffect(()=>{if(!user){setNotifications([]);setUnread(0);return;}api('/api/notifications').then((x:any)=>{setNotifications(x.notifications||[]);setUnread(Number(x.unread||0))}).catch(()=>{})},[user]);
  const markRead=async(n:any)=>{try{await api(`/api/notifications/${n.id}/read`,{method:'PATCH'});setNotifications(v=>v.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x));setUnread(v=>Math.max(0,v-(n.read_at?0:1)))}catch{}};
  return <>
    <header className="header">
      <div className="nav-inner">
        <button className="hamb" onClick={()=>setOpen(!open)} type="button" aria-label="Open menu">☰</button>
        <a className="brand" href="#/" aria-label="SHANO SHAN home"><img className="full-brand-logo" src={logo} alt="SHANO SHAN FRAGRANCE"/></a>
        <nav className={open?"nav open":"nav"}>
          <a onClick={()=>nav("#/")}>Home</a><a onClick={()=>nav("#/shop")}>Shop</a><a onClick={()=>nav("#/scent")}>Find Your Scent</a><a onClick={()=>nav("#/about")}>About</a><a onClick={()=>nav("#/contact")}>Contact</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-btn" onClick={()=>setSearchOpen(true)} type="button" aria-label="Search"><Icon name="search"/></button>
          {user&&<div className="notice-wrap"><button className="icon-btn badge-wrap" onClick={()=>setNoticeOpen(v=>!v)} type="button" aria-label="Notifications"><Icon name="bell"/>{unread>0&&<b>{unread>9?'9+':unread}</b>}</button>{noticeOpen&&<div className="notice-pop"><div className="notice-head"><b>Notifications</b><button onClick={()=>setNoticeOpen(false)} type="button">×</button></div>{notifications.length?notifications.slice(0,8).map((n:any)=><button className={n.read_at?'notice-item read':'notice-item'} key={n.id} onClick={()=>markRead(n)} type="button"><b>{n.title}</b><span>{n.body}</span><small>{new Date(n.created_at).toLocaleString()}</small></button>):<p className="notice-empty">No notifications.</p>}</div>}</div>}
          {canInstall&&<button className="install-btn" onClick={install} type="button" aria-label="Install SHANO SHAN">Install</button>}
          <button className="icon-btn badge-wrap" onClick={()=>nav("#/account")} type="button" aria-label={user?"Account":"Login"}><Icon name="user"/></button>
          <button className="icon-btn badge-wrap" onClick={()=>nav("#/cart")} type="button" aria-label="Cart"><Icon name="cart"/>{count>0&&<b>{count}</b>}</button>
          {user&&<button className="desktop logout-icon" onClick={logout} type="button" aria-label="Logout">↪</button>}
        </div>
      </div>
    </header>
    {searchOpen&&<SearchPanel onClose={()=>setSearchOpen(false)}/>}
  </>;
}

/* =========================================================
   LIVE TOP BAR
========================================================= */
function Announcement({items}:{items:any[]}){
  const messages=items.map((x:any)=>x.text||x.title||x.value).filter(Boolean);
  if(!messages.length)return null;
  return <div className="announcement" aria-label="Live store messages"><div className="announcement-track">{[...messages,...messages].map((m,i)=><span key={`${m}-${i}`}>{m}</span>)}</div></div>;
}

/* =========================================================
   ROUTER
========================================================= */

function renderRoute({
  site,
  home,
  route,
}: {
  site: any;
  home: any;
  route: string;
}) {
  const hash = route || "#/";

  const path = hash
    .replace(/^#\/?/, "")
    .split("?")[0];

  const productSlug = hash.match(
    /^#\/product\/(.+)/
  )?.[1];

  if (productSlug) {
    return (
      <Product
        slug={decodeURIComponent(productSlug)}
      />
    );
  }

  switch (path) {
    case "shop":
      return <Shop />;

    case "scent":
      return <ScentQuiz />;

    case "about":
      return (
        <ContentPage
          title="About SHANO SHAN"
          keys={[
            "about_story",
            "founder_bio",
          ]}
        />
      );

    case "contact":
      return <ContactPage site={site} />;

    case "cart":
      return <Cart />;

    case "checkout":
      return <Checkout />;

    case "account":
      return <Account />;

    case "orders":
      return <Orders />;

    case "order":
      return <OrderDetail />;

    case "policies":
      return (
        <ContentPage
          title="Policies"
          keys={[
            "shipping_policy",
            "return_policy",
            "privacy_policy",
            "terms",
          ]}
        />
      );

    default:
      return <Home home={home} site={site} />;
  }
}

/* =========================================================
   HOME
========================================================= */
function bannerFont(font:string){
  const map:any={
    serif:'Georgia, "Times New Roman", serif',
    classic:'"Times New Roman", Times, serif',
    sans:'Arial, Helvetica, sans-serif',
    display:'"Trebuchet MS", Arial, sans-serif',
    mono:'"Courier New", Courier, monospace'
  };
  return map[font]||map.serif;
}

function BannerCarousel({banners}:{banners:any[]}){
  const [index,setIndex]=useState(0);
  const touchStart=React.useRef<number|null>(null);
  const count=banners.length;

  useEffect(()=>{
    if(count<2)return;
    const t=setInterval(()=>setIndex(i=>(i+1)%count),5000);
    return()=>clearInterval(t);
  },[count]);

  useEffect(()=>{
    if(index>=count && count>0)setIndex(0);
  },[count,index]);

  if(!count){
    return <section className="banner-empty">
      <span className="eyebrow">SHANO SHAN FRAGRANCE</span>
      <h1>Discover your signature fragrance.</h1>
      <button onClick={()=>location.hash="#/shop"} type="button">Explore Fragrances</button>
    </section>;
  }

  const go=(next:number)=>setIndex((next+count)%count);

  return <section className="banner-carousel" aria-label="Promotional banners">
    <div
      className="banner-track"
      style={{transform:`translate3d(-${index*100}%,0,0)`}}
      onTouchStart={e=>{touchStart.current=e.touches[0].clientX}}
      onTouchEnd={e=>{
        if(touchStart.current===null)return;
        const dx=e.changedTouches[0].clientX-touchStart.current;
        if(Math.abs(dx)>45)go(index+(dx<0?1:-1));
        touchStart.current=null;
      }}
    >
      {banners.map((b:any)=><article className="banner-slide" key={b.id}>
        <picture>
          {(b.mobile_url||b.desktop_url)&&<>
            <source media="(max-width: 700px)" srcSet={b.mobile_url||b.desktop_url}/>
            <img src={b.desktop_url||b.mobile_url} alt={b.title||"SHANO SHAN promotional banner"}/>
          </>}
        </picture>
        {b.video_url&&<video autoPlay muted loop playsInline preload="metadata" poster={b.desktop_url||b.mobile_url||undefined}>
          <source src={b.video_url} type="video/mp4"/>
        </video>}
        <div className="banner-shade" style={{background:b.overlay_color||undefined}}/>
        {(b.title||b.subtitle||b.cta_text)&&<div className="banner-copy" style={{left:`${Number(b.text_x??7)}%`,bottom:`${Number(b.text_y??12)}%`}}>
          {b.subtitle&&<span style={{fontFamily:bannerFont(b.subtitle_font),color:b.text_color||undefined,fontSize:`clamp(10px,${Math.max(1.5,Number(b.subtitle_size||11)/6)}vw,${Number(b.subtitle_size||11)}px)`}}>{b.subtitle}</span>}
          {b.title&&<h2 style={{fontFamily:bannerFont(b.title_font),color:b.text_color||undefined,fontSize:`clamp(24px,${Math.max(2.5,Number(b.title_size||48)/12)}vw,${Number(b.title_size||48)}px)`}}>{b.title}</h2>}
          {b.cta_text&&<button type="button" style={{fontFamily:bannerFont(b.cta_font),color:b.text_color||undefined}} onClick={()=>{const u=b.cta_url||"#/shop";u.startsWith("#")?location.hash=u:window.location.href=u}}>{b.cta_text}</button>}
        </div>}
      </article>)}
    </div>
    {count>1&&<>
      <button className="banner-arrow left" type="button" onClick={()=>go(index-1)} aria-label="Previous banner"><Icon name="chevronLeft"/></button>
      <button className="banner-arrow right" type="button" onClick={()=>go(index+1)} aria-label="Next banner"><Icon name="chevronRight"/></button>
      <div className="banner-dots">
        {banners.map((b:any,i:number)=><button type="button" key={b.id} className={i===index?"active":""} onClick={()=>setIndex(i)} aria-label={`Go to banner ${i+1}`}/>)}
      </div>
    </>}
  </section>;
}

function Home({home,site}:{home:any;site:any}){
  const [products,setProducts]=useState<any[]>([]);
  const banners=Array.isArray(home?.banners)?home.banners:[];
  useEffect(()=>{api("/api/products?limit=8").then(x=>setProducts(x.products||[])).catch(()=>{})},[]);
  const founderImage=site.settings?.founder_image_url||site.settings?.founder_image||"";
  const founderName=site.settings?.founder_name||"SHANO SHAN";
  const founderBio=site.settings?.founder_bio||"SHANO SHAN is built around the idea that fragrance should feel personal, memorable and unmistakably yours.";
  const founderQuote=site.settings?.founder_quote||"Every fragrance has a story. This is ours.";
  return <div>
    <BannerCarousel banners={banners}/>
    <section className="section"><SectionHeading eyebrow="THE COLLECTION" title="Featured Fragrances" text="Explore the scents currently available from SHANO SHAN."/><ProductGrid products={products}/><button className="outline center" onClick={()=>location.hash="#/shop"}>View All Fragrances</button></section>
    <section className="founder">
      <div className="founder-art">{founderImage?<img className="founder-image" src={founderImage} alt={founderName}/>:<div className="portrait-placeholder">SHANO<br/>SHAN</div>}</div>
      <div><span className="eyebrow">THE MAN BEHIND SHANO SHAN</span><h2>{founderQuote.split(". ")[0]||"Every fragrance has a story."}<br/><em>{founderQuote.includes(". ")?founderQuote.slice(founderQuote.indexOf(". ")+2):"This is ours."}</em></h2><p><strong>{founderName}</strong></p><p>{founderBio}</p><button onClick={()=>location.hash="#/about"}>Meet the Founder</button></div>
    </section>
  </div>;
}

function ShanoAIWidget(){
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [messages,setMessages]=useState<any[]>([
    {role:"assistant",text:"Assalam-o-alaikum! I’m SHANO AI. Ask me anything about our perfumes, attars, sizes, notes, prices, stock, delivery, orders, payment methods or store policies — in any language."}
  ]);
  const [pos,setPos]=useState(()=>{try{return JSON.parse(localStorage.getItem("ss_ai_position")||"null")||{right:22,bottom:22}}catch{return{right:22,bottom:22}}});
  const drag=React.useRef<{x:number;y:number;right:number;bottom:number}|null>(null);

  const start=(e:React.PointerEvent)=>{
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current={x:e.clientX,y:e.clientY,right:pos.right,bottom:pos.bottom};
  };
  const move=(e:React.PointerEvent)=>{
    if(!drag.current)return;
    const d=drag.current;
    const next={
      right:Math.max(8,Math.min(window.innerWidth-70,d.right-(e.clientX-d.x))),
      bottom:Math.max(8,Math.min(window.innerHeight-70,d.bottom-(e.clientY-d.y)))
    };
    setPos(next);
    try{localStorage.setItem("ss_ai_position",JSON.stringify(next))}catch{}
  };
  const end=()=>{drag.current=null};

  const send=async()=>{
    const q=input.trim();
    if(!q||busy)return;
    setInput("");
    setMessages(m=>[...m,{role:"user",text:q}]);
    setBusy(true);
    try{
      const x=await api("/api/ai/chat",{method:"POST",body:JSON.stringify({message:q,mode:"customer"})});
      setMessages(m=>[...m,{role:"assistant",text:x.reply||"I’m sorry, I couldn’t answer that right now."}]);
    }catch(e:any){
      setMessages(m=>[...m,{role:"assistant",text:"I’m having trouble connecting right now. Please try again in a moment."}]);
    }finally{setBusy(false)}
  };

  return <div className="ai-float" style={{right:pos.right,bottom:pos.bottom}}>
    {open&&<div className="ai-chat">
      <div className="ai-chat-head">
        <span><Icon name="robot" size={18}/> SHANO AI</span>
        <button type="button" onClick={()=>setOpen(false)} aria-label="Close AI"><Icon name="close" size={16}/></button>
      </div>
      <div className="ai-chat-body">
        {messages.map((m,i)=><div key={i} className={`ai-message ${m.role}`}>{m.text}</div>)}
        {busy&&<div className="ai-message assistant">Thinking…</div>}
      </div>
      <div className="ai-chat-input">
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")send()}}
          placeholder="Ask about perfumes, attars, orders…"
          aria-label="Ask SHANO AI"
        />
        <button type="button" onClick={send} disabled={busy||!input.trim()}>Send</button>
      </div>
    </div>}
    <button
      className="ai-fab"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={()=>setOpen(v=>!v)}
      aria-label="Move or open SHANO AI"
      type="button"
    >
      <Icon name="robot" size={28}/>
    </button>
  </div>;
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">
        {eyebrow}
      </span>

      <h2>{title}</h2>

      {text && <p>{text}</p>}
    </div>
  );
}

/* =========================================================
   SHOP
========================================================= */

function Shop(){
 const [products,setProducts]=useState<any[]>([]),[cats,setCats]=useState<any[]>([]),[sizes,setSizes]=useState<string[]>([]),[q,setQ]=useState(""),[category,setCategory]=useState(""),[gender,setGender]=useState(""),[rating,setRating]=useState(""),[size,setSize]=useState(""),[sort,setSort]=useState("newest"),[page,setPage]=useState(1),[total,setTotal]=useState(0);
 const load=()=>{const params=new URLSearchParams({limit:"12",page:String(page),q});if(category)params.set("category",category);if(gender)params.set("gender",gender);if(rating)params.set("min_rating",rating);if(size)params.set("size",size);params.set("sort",sort);api(`/api/products?${params}`).then(x=>{setProducts(x.products||[]);setTotal(x.total||0);const all=(x.products||[]).flatMap((p:any)=>String(p.sizes||"").split(",").map((v:string)=>v.trim()).filter(Boolean));setSizes(prev=>prev.length?prev:Array.from(new Set(all)))}).catch(()=>{})};
 useEffect(()=>{api("/api/categories").then(x=>setCats(x.categories||[])).catch(()=>{});api("/api/product-sizes").then(x=>setSizes(x.sizes||[])).catch(()=>{})},[]);useEffect(()=>{load()},[page,category,gender,rating,size,sort]);
 const [filterOpen,setFilterOpen]=useState(false);
 const clearFilters=()=>{setQ("");setCategory("");setGender("");setRating("");setSize("");setSort("newest");setPage(1)};
 const filterCount=[category,gender,rating,size].filter(Boolean).length;
 const filterPanel=<><button className={`filter-backdrop ${filterOpen?"open":""}`} type="button" aria-label="Close filters" onClick={()=>setFilterOpen(false)}></button><div className={`filter-drawer ${filterOpen?"open":""}`}><div className="filter-drawer-head"><div><small>FILTERS</small><h3>Refine Fragrances</h3></div><button className="filter-close" type="button" onClick={()=>setFilterOpen(false)}><Icon name="close"/></button></div><div className="filter-fields"><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="">All categories</option>{cats.map(c=><option value={c.slug} key={c.id}>{c.name}</option>)}</select></label><label>Gender<select value={gender} onChange={e=>{setGender(e.target.value);setPage(1)}}><option value="">All</option><option value="Men">Men</option><option value="Women">Women</option><option value="Unisex">Unisex</option></select></label><label>Rating<select value={rating} onChange={e=>{setRating(e.target.value);setPage(1)}}><option value="">All ratings</option><option value="4">4★ & above</option><option value="3">3★ & above</option><option value="2">2★ & above</option></select></label><label>Size / ML<select value={size} onChange={e=>{setSize(e.target.value);setPage(1)}}><option value="">All sizes</option>{sizes.map(x=><option key={x}>{x}</option>)}</select></label><label>Sort by<select value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}}><option value="newest">Newest</option><option value="price_asc">Price: Low → High</option><option value="price_desc">Price: High → Low</option><option value="rating">Rating</option><option value="views">Most Viewed</option></select></label></div><div className="filter-drawer-actions"><button type="button" onClick={clearFilters}>Clear All</button><button className="primary" type="button" onClick={()=>{setPage(1);load();setFilterOpen(false)}}>Apply Filters</button></div></div></>;
 return <section className="section shop"><SectionHeading eyebrow="SHOP" title="All Fragrances" text="Find your signature scent."/><div className="shop-toolbar"><div className="shop-search"><Icon name="search" size={18}/><input placeholder="Search fragrances..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setPage(1);load()}}}/><button type="button" onClick={()=>{setPage(1);load()}}>Search</button></div><button className="filter-trigger" type="button" onClick={()=>setFilterOpen(true)}><Icon name="filter" size={18}/> Filters{filterCount>0&&<b>{filterCount}</b>}</button></div>{filterPanel}<ProductGrid products={products}/><div className="pager">{page>1&&<button onClick={()=>setPage(page-1)} type="button">Previous</button>}<span>{products.length} of {total}</span>{page*12<total&&<button onClick={()=>setPage(page+1)} type="button">Next</button>}</div></section>;
}

/* =========================================================
   PRODUCTS
========================================================= */

function ProductGrid({
  products,
}: {
  products: any[];
}) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard
          p={p}
          key={p.id}
        />
      ))}
    </div>
  );
}

function ProductCard({
  p,
}: {
  p: any;
}) {
  const { addToCart } = useStore();

  return (
    <article className="product-card">
      <a
        href={`#/product/${encodeURIComponent(
          p.slug
        )}`}
      >
        <div className="product-image">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
            />
          ) : (
            <span>SHANO SHAN</span>
          )}
        </div>

        <div className="product-info">
          <small>
            {p.category_name ||
              p.gender ||
              "FRAGRANCE"}
          </small>

          <h3>{p.name}</h3>

          <strong>
            {money(
              p.sale_price ?? p.price
            )}
          </strong>

          {p.sale_price && (
            <del>{money(p.price)}</del>
          )}
        </div>
      </a>

      <button
        onClick={() => addToCart(p)}
        type="button"
      >
        Add to Bag
      </button>
    </article>
  );
}

/* =========================================================
   PRODUCT DETAIL
========================================================= */

function Product({slug}:{slug:string}) {
  const [p,setP]=useState<any>(null),[qty,setQty]=useState(1),[img,setImg]=useState(""),[selectedVariant,setSelectedVariant]=useState<any>(null),[reviews,setReviews]=useState<any[]>([]),[breakdown,setBreakdown]=useState<any[]>([]),[review,setReview]=useState(false);
  const {addToCart,user,toast}=useStore();
  const [zoom,setZoom]=useState(false);
  useEffect(()=>{api(`/api/products/${encodeURIComponent(slug)}`).then(x=>{setP(x.product);setImg(x.product.images?.[0]?.secure_url||"");setSelectedVariant(x.product.variants?.[0]||null);api(`/api/products/${x.product.id}/reviews`).then(r=>{setReviews(r.reviews||[]);setBreakdown(r.breakdown||[])}).catch(()=>{});api(`/api/products/${x.product.id}/view`,{method:"POST"}).catch(()=>{})}).catch(()=>{})},[slug]);
  if(!p)return <section className="section loading">Loading fragrance...</section>;
  const variant=selectedVariant, stock=variant?Number(variant.stock):Number(p.stock), price=variant?.sale_price??variant?.price??p.sale_price??p.price, minQ=Math.max(1,Number(p.min_quantity||1)), maxQ=Math.min(Number(p.max_quantity||99),stock||99);
  const buyNow=async()=>{await addToCart(p,qty,variant?.id);location.hash="#/checkout"};
  return <section className="section product-detail"><div className="gallery"><div className="main-image" onClick={()=>img&&setZoom(true)} role={img?"button":undefined} tabIndex={img?0:undefined} onKeyDown={e=>{if(img&&(e.key==='Enter'||e.key===' '))setZoom(true)}}>{img?<img src={img} alt={p.name}/>:<span>SHANO SHAN</span>}</div><div className="thumbs">{p.images?.map((i:any)=><button key={i.id} onClick={()=>setImg(i.secure_url)} type="button"><img src={i.secure_url} alt={p.name}/></button>)}</div></div><div className="product-copy"><span className="eyebrow">{p.fragrance_family||p.gender||"SIGNATURE FRAGRANCE"}</span><h1>{p.name}</h1><div className="price">{money(price)}{variant?.sale_price&&<del>{money(variant.price)}</del>}</div>{p.rating>0&&<p>★★★★★ {Number(p.rating).toFixed(1)} · {p.review_count} ratings</p>}<p>{p.short_description||p.description}</p>{p.variants?.length>0&&<div className="variant-picker"><div className="variant-title"><span className="eyebrow">SIZE / ML</span><b>Choose your size</b></div><div className="variant-grid">{p.variants.map((v:any)=><button key={v.id} className={selectedVariant?.id===v.id?"variant-option active":"variant-option"} disabled={!v.active||v.stock<=0} onClick={()=>{setSelectedVariant(v);setQty(Math.max(minQ,1))}} type="button"><strong>{v.name}</strong><span>{money(v.sale_price??v.price)}</span>{v.stock<=0&&<small>Out of stock</small>}</button>)}</div></div>}{stock<=0?<b className="sold">Out of stock</b>:<><div className="qty"><button onClick={()=>setQty(Math.max(minQ,qty-1))} type="button">−</button><b>{qty}</b><button onClick={()=>setQty(Math.min(maxQ,qty+1))} type="button">+</button></div><small>Minimum {minQ} · Maximum {maxQ}</small><button className="wide" onClick={()=>addToCart(p,qty,variant?.id)} type="button">ADD TO CART</button><button className="wide" onClick={buyNow} type="button">BUY NOW</button></>}{p.top_notes&&<div className="notes"><div><b>Top Notes</b><span>{p.top_notes}</span></div>{p.heart_notes&&<div><b>Heart Notes</b><span>{p.heart_notes}</span></div>}{p.base_notes&&<div><b>Base Notes</b><span>{p.base_notes}</span></div>}</div>}<button className="text-btn" onClick={()=>{if(!user){toast("Please log in to leave a review");return}setReview(!review)}} type="button">Write a review</button>{review&&<Review productId={p.id}/>}<div className="reviews"><h3>Customer Reviews</h3>{reviews.length?reviews.map((r:any)=><article key={r.id}><b>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</b><small>{r.name}{r.verified_purchase?" · Verified Purchase":""}</small><p>{r.body}</p></article>):<p>No approved reviews yet.</p>}</div></div>{zoom&&<div className="image-lightbox" role="dialog" aria-modal="true" onClick={()=>setZoom(false)}><button type="button" aria-label="Close image" onClick={()=>setZoom(false)}>×</button><img src={img} alt={p.name} onClick={e=>e.stopPropagation()}/></div>}</section>;
}

/* =========================================================
   REVIEW
========================================================= */

function Review({
  productId,
}: {
  productId: number;
}) {
  const [rating, setRating] =
    useState(5);

  const [body, setBody] =
    useState("");

  const { toast } = useStore();

  return (
    <div className="review-form">
      <select
        value={rating}
        onChange={(e) =>
          setRating(
            Number(e.target.value)
          )
        }
      >
        <option>5</option>
        <option>4</option>
        <option>3</option>
        <option>2</option>
        <option>1</option>
      </select>

      <textarea
        value={body}
        onChange={(e) =>
          setBody(e.target.value)
        }
        placeholder="Your experience..."
      />

      <button
        onClick={async () => {
          try {
            await api("/api/reviews", {
              method: "POST",
              body: JSON.stringify({
                product_id: productId,
                rating,
                body,
              }),
            });

            toast(
              "Review submitted for approval"
            );

            setBody("");
          } catch (e: any) {
            toast(e.message);
          }
        }}
        type="button"
      >
        Submit review
      </button>
    </div>
  );
}

/* =========================================================
   CART
========================================================= */

function Cart() {
  const {
    cart,
    refreshCart,
  } = useStore();

  const items = cart.items || [];

  const subtotal = items.reduce(
    (n: any, i: any) =>
      n +
      Number(
        i.sale_price ?? i.price
      ) *
        Number(i.quantity),
    0
  );

  return (
    <section className="section">
      <SectionHeading
        eyebrow="YOUR BAG"
        title="Shopping Cart"
      />

      {!items.length ? (
        <div className="empty">
          <p>
            Your bag is empty.
          </p>

          <button
            onClick={() =>
              (location.hash = "#/shop")
            }
            type="button"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((i: any) => (
              <div
                className="cart-row"
                key={i.id}
              >
                <div className="cart-pic">
                  {i.image_url && (
                    <img
                      src={i.image_url}
                      alt={i.name}
                    />
                  )}
                </div>

                <div>
                  <a
                    href={`#/product/${i.slug}`}
                  >
                    <h3>{i.name}</h3>
                  </a>

                  <p>
                    {money(
                      i.sale_price ??
                        i.price
                    )}
                  </p>
                </div>

                <div className="qty">
                  <button
                    onClick={async () => {
                      await api(
                        `/api/cart/items/${i.id}`,
                        {
                          method: "PATCH",
                          body: JSON.stringify(
                            {
                              quantity:
                                Math.max(
                                  1,
                                  i.quantity -
                                    1
                                ),
                            }
                          ),
                        }
                      );

                      refreshCart();
                    }}
                    type="button"
                  >
                    −
                  </button>

                  <b>{i.quantity}</b>

                  <button
                    onClick={async () => {
                      await api(
                        `/api/cart/items/${i.id}`,
                        {
                          method: "PATCH",
                          body: JSON.stringify(
                            {
                              quantity:
                                i.quantity +
                                1,
                            }
                          ),
                        }
                      );

                      refreshCart();
                    }}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <button
                  className="remove"
                  onClick={async () => {
                    await api(
                      `/api/cart/items/${i.id}`,
                      {
                        method: "DELETE",
                      }
                    );

                    refreshCart();
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="summary">
            <span>Subtotal</span>

            <b>{money(subtotal)}</b>

            <button
              className="wide"
              onClick={() =>
                (location.hash =
                  "#/checkout")
              }
              type="button"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* =========================================================
   CHECKOUT
========================================================= */

function Checkout() {
  const {
    cart,
    refreshCart,
    user,
    toast,
  } = useStore();

  const [form, setForm] =
    useState<any>({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      payment_method: "cod",
    });

  const [receipt, setReceipt] =
    useState<File | null>(null);

  const [ref, setRef] =
    useState("");

  const [note, setNote] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);

  useEffect(()=>{api("/api/payment-methods").then(x=>setPaymentMethods(x.payment_methods||[])).catch(()=>{});api("/api/checkout/quote",{method:"POST",body:JSON.stringify({payment_method:form.payment_method})}).then(setQuote).catch(()=>{})},[cart.items?.map((i:any)=>`${i.id}:${i.quantity}`).join(","),form.payment_method]);

  useEffect(() => {
    if (user) {
      setForm((x: any) => ({
        ...x,
        name:
          user.name || x.name,
        email:
          user.email || x.email,
        phone:
          user.phone || x.phone,
      }));
    }
  }, [user]);

  const submit = async () => {
    if (!user) {
      location.hash="#/account";
      return;
    }
    if(form.payment_method!="cod" && !receipt){toast("Please upload your payment receipt before placing the order.");return;}
    setBusy(true);

    try {
      let receiptToken="";
      if(form.payment_method!="cod" && receipt){
        const fd=new FormData(); fd.append("receipt",receipt);
        const uploaded=await api("/api/payment-receipts/preupload",{method:"POST",body:fd});
        receiptToken=uploaded.token;
      }
      const x = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({...form,receipt_token:receiptToken}),
      });

      toast(
        "Order placed successfully"
      );

      await refreshCart();

      location.hash = `#/order?number=${encodeURIComponent(
        x.order_number
      )}`;
    } catch (e: any) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };

  if(!user){
    return <section className="section checkout">
      <SectionHeading eyebrow="CHECKOUT" title="Login Required"/>
      <div className="checkout-login-required panel">
        <div className="checkout-login-icon"><Icon name="user" size={34}/></div>
        <h3>Please login to place your order</h3>
        <p>You need to sign in to your SHANO SHAN account before placing an order.</p>
        <button className="wide primary" type="button" onClick={()=>location.hash="#/account"}>Login / Create Account</button>
      </div>
    </section>;
  }

  return (
    <section className="section checkout">
      <SectionHeading
        eyebrow="CHECKOUT"
        title="Complete Your Order"
      />

      <div className="checkout-grid">
        <div className="panel">
          <h3>
            Customer & Shipping
          </h3>

          {["name","email","phone","address"].map((k)=>(<input key={k} placeholder={k.replace("_"," ").toUpperCase()} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>))}
          <label className="checkout-field-label">Province<select value={form.province} onChange={e=>{setForm({...form,province:e.target.value,city:""})}}><option value="">Select Province / Territory</option>{PAKISTAN_PROVINCES.map(p=><option key={p}>{p}</option>)}</select></label>
          <label className="checkout-field-label">City / Town<select value={form.city} disabled={!form.province} onChange={e=>setForm({...form,city:e.target.value})}><option value="">{form.province?"Select City / Town":"Select province first"}</option>{(PAKISTAN_CITIES[form.province]||[]).map(city=><option value={city} key={city}>{city}</option>)}</select></label>
          <input placeholder="POSTAL CODE" value={form.postal_code} onChange={e=>setForm({...form,postal_code:e.target.value})}/>

          <h3>Payment</h3>
          {paymentMethods.map((m:any)=>{const value=m.method_type==='cod'?'cod':`pm_${m.id}`;return <label className="radio" key={m.id}><input type="radio" checked={form.payment_method===value} onChange={()=>setForm({...form,payment_method:value})}/>{m.name}</label>})}
          {paymentMethods.length===0&&<label className="radio"><input type="radio" checked={form.payment_method==="cod"} onChange={()=>setForm({...form,payment_method:"cod"})}/>Cash on Delivery</label>}
          {form.payment_method!=="cod"&&(()=>{const pm=paymentMethods.find((m:any)=>form.payment_method===`pm_${m.id}`);return <div className="manual-box"><h4>{pm?.name||"Online Payment"}</h4><p>Complete the payment using the store details below, then upload your receipt.</p>{pm?.account_title&&<div className="payment-detail"><span>Account Title</span><b>{pm.account_title}</b></div>}{pm?.account_number&&<div className="payment-detail"><span>Account Number</span><b>{pm.account_number}</b></div>}{pm?.phone_number&&<div className="payment-detail"><span>Phone / Wallet Number</span><b>{pm.phone_number}</b></div>}{pm?.bank_name&&<div className="payment-detail"><span>Bank Name</span><b>{pm.bank_name}</b></div>}{pm?.iban&&<div className="payment-detail"><span>IBAN</span><b>{pm.iban}</b></div>}{pm?.qr_url&&<img src={pm.qr_url} alt="Payment QR" className="receipt"/>}{pm?.instructions&&<p className="payment-instructions">{pm.instructions}</p>}<input placeholder="Payment reference" value={ref} onChange={e=>setRef(e.target.value)}/><textarea placeholder="Payment note" value={note} onChange={e=>setNote(e.target.value)}/><label className="receipt-required">Payment Receipt <strong>* Required</strong><input type="file" accept="image/*,.pdf" onChange={e=>setReceipt(e.target.files?.[0]||null)}/></label><small className="receipt-help">Please upload your payment receipt. The order cannot be placed without it.</small></div>})()}
          {quote&&<><div className="sum-line"><span>Delivery</span><b>{money(quote.delivery_fee)}</b></div>{quote.cod_delivery_advance>0&&form.payment_method==="cod"&&<div className="cod-advance-note">COD delivery advance included: {money(quote.cod_delivery_advance)}</div>}</>}

          <button
            className="wide"
            disabled={busy}
            onClick={submit}
            type="button"
          >
            {busy
              ? "Placing Order..."
              : "Place Order"}
          </button>
        </div>

        <OrderSummary cart={cart} />
      </div>
    </section>
  );
}

/* =========================================================
   ORDER SUMMARY
========================================================= */

function OrderSummary({
  cart,
}: {
  cart: any;
}) {
  const subtotal = (
    cart.items || []
  ).reduce(
    (n: any, i: any) =>
      n +
      Number(
        i.sale_price ?? i.price
      ) * i.quantity,
    0
  );

  return (
    <div className="summary">
      <h3>Order Summary</h3>

      {(cart.items || []).map(
        (i: any) => (
          <div
            className="sum-line"
            key={i.id}
          >
            <span>
              {i.name} × {i.quantity}
            </span>

            <b>
              {money(
                (i.sale_price ??
                  i.price) *
                  i.quantity
              )}
            </b>
          </div>
        )
      )}

      <hr />

      <div className="sum-line">
        <span>Subtotal</span>
        <b>{money(subtotal)}</b>
      </div>

      <p>
        Delivery fee is calculated by
        the store.
      </p>
    </div>
  );
}

/* =========================================================
   ACCOUNT
========================================================= */

function Account() {
  const {
    user,
    setUser,
    toast,
  } = useStore();

  const [login, setLogin] =
    useState(true);

  const [f, setF] =
    useState<any>({
      email: "",
      password: "",
      name: "",
      phone: "",
    });

  if (user) {
    return (
      <section className="section account">
        <SectionHeading
          eyebrow="ACCOUNT"
          title={`Welcome, ${user.name}`}
        />

        <div className="account-cards">
          <button
            onClick={() =>
              (location.hash =
                "#/orders")
            }
            type="button"
          >
            My Orders
          </button>

          <button
            onClick={() => {
              localStorage.removeItem(
                "ss_customer_token"
              );

              setUser(null);
            }}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </section>
    );
  }

  const submit = async () => {
    try {
      const x = await api(
        `/api/auth/${
          login ? "login" : "register"
        }`,
        {
          method: "POST",
          body: JSON.stringify(f),
        }
      );

      localStorage.setItem(
        "ss_customer_token",
        x.token
      );

      setUser(x.user);

      location.hash = "#/";
    } catch (e: any) {
      toast(e.message);
    }
  };

  return (
    <section className="section auth">
      <div className="auth-box">
        <span className="eyebrow">
          SHANO SHAN
        </span>

        <h1>
          {login
            ? "Welcome Back"
            : "Create Your Account"}
        </h1>

        {!login && (
          <>
            <input
              placeholder="Name"
              value={f.name}
              onChange={(e) =>
                setF({
                  ...f,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Phone"
              value={f.phone}
              onChange={(e) =>
                setF({
                  ...f,
                  phone: e.target.value,
                })
              }
            />
          </>
        )}

        <input
          placeholder="Email"
          value={f.email}
          onChange={(e) =>
            setF({
              ...f,
              email: e.target.value,
            })
          }
        />

        <input
          type="password"
          placeholder="Password (8+ characters)"
          value={f.password}
          onChange={(e) =>
            setF({
              ...f,
              password:
                e.target.value,
            })
          }
        />

        <button
          className="wide"
          onClick={submit}
          type="button"
        >
          {login
            ? "Sign In"
            : "Register"}
        </button>

        <button
          className="text-btn"
          onClick={() =>
            setLogin(!login)
          }
          type="button"
        >
          {login
            ? "Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   ORDERS
========================================================= */

function Orders() {
  const [orders, setOrders] =
    useState<any[]>([]);

  const { user } = useStore();

  useEffect(() => {
    api("/api/orders")
      .then((x) =>
        setOrders(x.orders || [])
      )
      .catch(() => {});
  }, []);

  if (!user) {
    return (
      <section className="section">
        <EmptyLogin />
      </section>
    );
  }

  return (
    <section className="section">
      <SectionHeading
        eyebrow="ACCOUNT"
        title="My Orders"
      />

      <div className="orders">
        {orders.map((o) => (
          <a
            href={`#/order?id=${o.id}`}
            className="order-card"
            key={o.id}
          >
            <b>{o.order_number}</b>

            <span>
              {new Date(
                o.created_at
              ).toLocaleString()}
            </span>

            <span>
              {money(o.total)}
            </span>

            <strong>
              {o.status}
            </strong>
          </a>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   EMPTY LOGIN
========================================================= */

function EmptyLogin() {
  return (
    <div className="empty">
      <p>
        Please sign in to view your
        orders.
      </p>

      <button
        onClick={() =>
          (location.hash =
            "#/account")
        }
        type="button"
      >
        Sign In
      </button>
    </div>
  );
}

/* =========================================================
   ORDER DETAIL
========================================================= */

function OrderDetail() {
  const qs = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = qs.get("id");
  const number = qs.get("number");
  const [data,setData]=useState<any>(null);
  const [file,setFile]=useState<File|null>(null);
  const [action,setAction]=useState("");
  const [reason,setReason]=useState("");
  const [refund,setRefund]=useState<any>({refund_method:"Bank Transfer",refund_account_title:"",refund_account_number:"",refund_bank_name:"",refund_iban:"",refund_phone:"",refund_note:""});
  const {toast}=useStore();
  const load=()=>{if(id)return api(`/api/orders/${id}`).then(setData).catch(()=>{});if(number)return api(`/api/orders/${encodeURIComponent(number)}`).then(setData).catch(()=>{})};
  useEffect(()=>{load()},[id,number]);
  if(!data)return <section className="section loading">Loading order...</section>;
  const o=data.order;
  const blocked=['Shipped','Out for Delivery','Cancelled','Returned','Refunded'];
  const canCancel=!blocked.includes(o.status)&&!['requested','approved'].includes(o.customer_action_status);
  const canReturn=o.status==='Delivered'&&o.customer_action_status==='none';
  const request=async(a:string)=>{try{await api(`/api/orders/${o.id}/action`,{method:'POST',body:JSON.stringify({action:a,reason})});toast(`${a==='return'?'Return':'Cancellation'} request submitted.`);load()}catch(e:any){toast(e.message)}};
  const saveRefund=async()=>{try{await api(`/api/orders/${o.id}/refund-details`,{method:'POST',body:JSON.stringify(refund)});toast('Refund details submitted.');load()}catch(e:any){toast(e.message)}};
  return <section className="section"><SectionHeading eyebrow="ORDER" title={o.order_number}/><div className="order-detail"><p><b>Status:</b> {o.status}</p><p><b>Payment:</b> {o.payment_status}</p><p><b>Delivery Address:</b> {o.address}, {o.city}{o.province?`, ${o.province}`:""}{o.postal_code?` ${o.postal_code}`:""}</p>{data.items.map((i:any)=><div className="sum-line" key={i.id}><span>{i.name}{i.variant_name?` · ${i.variant_name}`:""} × {i.quantity}</span><b>{money(i.line_total)}</b></div>)}<div className="sum-line"><span>Delivery</span><b>{money(o.delivery_fee)}</b></div><div className="sum-line"><span>Total</span><b>{money(o.total)}</b></div>
    <div className="tracking-card"><div className="tracking-head"><div><span className="eyebrow">PARCEL TRACKING</span><h3>{o.courier||"SHANO SHAN DELIVERY"}</h3></div>{o.tracking_number&&<b>{o.tracking_number}</b>}</div><div className="tracking-line">{(data.tracking||[]).map((t:any,i:number)=><div className={`tracking-step ${i===(data.tracking.length-1)?"current":""}`} key={t.id}><span className="tracking-dot">{i===(data.tracking.length-1)?"◆":"✓"}</span><div><b>{t.title}</b><small>{t.description}</small><small>{new Date(t.created_at).toLocaleString()}</small></div></div>)}</div>{o.tracking_url&&<a className="outline center" href={o.tracking_url} target="_blank" rel="noreferrer">Track with Courier</a>}</div>
    {o.customer_action_status==='requested'&&<div className="notice-box"><b>Your {o.customer_action} request is waiting for admin confirmation.</b></div>}
    {(canCancel||canReturn)&&<div className="order-action-box"><h3>Need help with this order?</h3><textarea placeholder="Reason (optional)" value={reason} onChange={e=>setReason(e.target.value)}/><div className="modal-actions">{canCancel&&<button type="button" onClick={()=>request('cancel')}>Request Cancellation</button>}{canReturn&&<button className="primary" type="button" onClick={()=>request('return')}>Request Return</button>}</div></div>}
    {['awaiting_details','approved','details_requested'].includes(o.refund_status)&&<div className="refund-box"><h3>Refund Details</h3><p>Your request has been approved. Please add the account where you want to receive your refund.</p><div className="form-grid"><label>Refund Method<select value={refund.refund_method} onChange={e=>setRefund({...refund,refund_method:e.target.value})}><option>Bank Transfer</option><option>EasyPaisa</option><option>JazzCash</option><option>Other</option></select></label><label>Account Title<input value={refund.refund_account_title} onChange={e=>setRefund({...refund,refund_account_title:e.target.value})}/></label><label>Account Number<input value={refund.refund_account_number} onChange={e=>setRefund({...refund,refund_account_number:e.target.value})}/></label><label>Bank Name<input value={refund.refund_bank_name} onChange={e=>setRefund({...refund,refund_bank_name:e.target.value})}/></label><label>IBAN<input value={refund.refund_iban} onChange={e=>setRefund({...refund,refund_iban:e.target.value})}/></label><label>Phone / Wallet<input value={refund.refund_phone} onChange={e=>setRefund({...refund,refund_phone:e.target.value})}/></label></div><textarea placeholder="Refund note" value={refund.refund_note} onChange={e=>setRefund({...refund,refund_note:e.target.value})}/><button className="wide primary" type="button" onClick={saveRefund}>Submit Refund Details</button></div>}
    {o.refund_status==='details_submitted'&&<div className="notice-box"><b>Your refund details have been received. Admin is processing your refund.</b></div>}
    {o.refund_status==='refunded'&&<div className="refund-box"><h3>Refund Completed</h3><p>Your refund has been processed.</p>{o.refund_receipt_url&&<a href={o.refund_receipt_url} target="_blank" rel="noreferrer">View refund payment receipt</a>}</div>}
    {data.payment?.method !== 'cod' && data.payment?.status !== 'Verified' && <div className="manual-box"><h3>Payment Receipt</h3>{data.payment?.receipt_url&&<a href={data.payment.receipt_url} target="_blank" rel="noreferrer"><img className="receipt" src={data.payment.receipt_url} alt="Payment receipt"/></a>}{data.payment?.rejection_reason&&<p className="error"><b>Receipt rejected:</b> {data.payment.rejection_reason}</p>}<input type="file" accept="image/*,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/><button onClick={async()=>{if(!file)return;const fd=new FormData();fd.append('receipt',file);try{await api(`/api/orders/${o.id}/receipt`,{method:'POST',body:fd});toast('Receipt uploaded');load()}catch(e:any){toast(e.message)}}} type="button">{data.payment?.rejection_reason?'Upload New Receipt':'Upload Receipt'}</button></div>}
  </div></section>;
}

/* =========================================================
   CONTENT PAGE
========================================================= */

function ContactPage({site}:{site:any}){
  const s=site.settings||{};
  const socials=[
    ['WhatsApp',s.contact_whatsapp,'whatsapp'],
    ['Instagram',s.instagram,'instagram'],
    ['Facebook',s.facebook,'facebook'],
    ['TikTok',s.tiktok,'tiktok'],
    ['YouTube',s.youtube,'youtube']
  ].filter((x:any)=>x[1]);
  const openExternal=(url:string)=>window.open(/^https?:\/\//i.test(url)?url:`https://${url}`,"_blank","noopener,noreferrer");
  return <section className="section contact-page">
    <SectionHeading eyebrow="SHANO SHAN" title="Contact"/>
    <div className="contact-grid">
      {s.contact_phone&&<a className="contact-card" href={`tel:${s.contact_phone}`}><Icon name="phone" size={24}/><span><b>Phone</b><small>{s.contact_phone}</small></span></a>}
      {s.contact_email&&<a className="contact-card" href={`mailto:${s.contact_email}`}><Icon name="mail" size={24}/><span><b>Email</b><small>{s.contact_email}</small></span></a>}
      {s.website&&<button className="contact-card" type="button" onClick={()=>openExternal(s.website)}><Icon name="globe" size={24}/><span><b>Website</b><small>Visit SHANO SHAN</small></span></button>}
    </div>
    {socials.length>0&&<div className="contact-socials">
      <h3>Follow & Chat With Us</h3>
      <div className="contact-social-grid">
        {socials.map(([name,url,icon]:any)=><button className="contact-social" key={name} type="button" onClick={()=>openExternal(url)}><Icon name={icon} size={24}/><span>{name}</span></button>)}
      </div>
    </div>}
  </section>;
}

function ContentPage({
  title,
  keys,
}: {
  title: string;
  keys: string[];
}) {
  const [values, setValues] =
    useState<any>({});

  useEffect(() => {
    Promise.all(
      keys.map((k) =>
        api("/api/settings/site")
          .then((x) => ({
            k,
            v:
              x.settings?.[k] ||
              "",
          }))
          .catch(() => ({
            k,
            v: "",
          }))
      )
    ).then((a) =>
      setValues(
        Object.fromEntries(
          a.map((x) => [
            x.k,
            x.v,
          ])
        )
      )
    );
  }, []);

  return (
    <section className="section content-page">
      <SectionHeading
        eyebrow="SHANO SHAN"
        title={title}
      />

      {keys.map((k) => (
        <article key={k}>
          <h2>
            {k.replace(
              /_/g,
              " "
            )}
          </h2>

          <div className="rich-text">
            {values[k] ||
              "Content will be available soon."}
          </div>
        </article>
      ))}
    </section>
  );
}

/* =========================================================
   SCENT QUIZ
========================================================= */

function ScentQuiz() {
  const [step, setStep] =
    useState(0);

  const [ans, setAns] =
    useState<string[]>([]);

  const qs = [
    [
      "Where are you wearing it?",
      "Everyday",
      "Work",
      "Evening",
      "Special occasion",
    ],
    [
      "What mood fits you?",
      "Fresh",
      "Warm",
      "Bold",
      "Mysterious",
    ],
    [
      "Which style sounds like you?",
      "Clean",
      "Elegant",
      "Intense",
      "Adventurous",
    ],
  ];

  const done = step >= qs.length;

  return (
    <section className="section quiz">
      {done ? (
        <>
          <SectionHeading
            eyebrow="YOUR SCENT"
            title="Your fragrance direction"
            text="Explore the collection and choose the scent whose notes speak to you."
          />

          <button
            onClick={() =>
              (location.hash =
                "#/shop")
            }
            type="button"
          >
            Explore Fragrances
          </button>
        </>
      ) : (
        <>
          <span className="eyebrow">
            FIND YOUR SCENT ·{" "}
            {step + 1}/
            {qs.length}
          </span>

          <h1>{qs[step][0]}</h1>

          <div className="quiz-options">
            {qs[step]
              .slice(1)
              .map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    setAns([
                      ...ans,
                      x,
                    ]);

                    setStep(
                      step + 1
                    );
                  }}
                  type="button"
                >
                  {x}
                </button>
              ))}
          </div>
        </>
      )}
    </section>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer({site}:{site:any}){
  const s=site.settings||{};
  const links=[
    ['WhatsApp',s.contact_whatsapp,'whatsapp'],
    ['Instagram',s.instagram,'instagram'],
    ['Facebook',s.facebook,'facebook'],
    ['TikTok',s.tiktok,'tiktok'],
    ['YouTube',s.youtube,'youtube']
  ].filter((x:any)=>x[1]);
  const openExternal=(url:string)=>{
    const u=/^https?:\/\//i.test(url)?url:`https://${url}`;
    window.open(u,"_blank","noopener,noreferrer");
  };
  return <footer>
    <div>
      <img className="footer-full-logo" src={logo} alt="SHANO SHAN FRAGRANCE"/>
      <p>{s.footer_text||"Luxury fragrance, crafted to become part of your story."}</p>
      {links.length>0&&<div className="social-row">
        {links.map(([name,url,icon]:any)=><button key={name} title={name} aria-label={name} onClick={()=>openExternal(url)}><Icon name={icon} size={17}/></button>)}
      </div>}
    </div>
    <div><h4>Explore</h4><a href="#/shop">Shop</a><a href="#/about">About</a><a href="#/contact">Contact</a><a href="#/policies">Policies</a></div>
    <div><h4>Account</h4><a href="#/account">Login</a><a href="#/orders">Orders</a><a href="#/cart">Cart</a></div>
    <div>
      <h4>Contact</h4>
      {s.contact_phone&&<p className="footer-contact"><Icon name="phone" size={16}/><a href={`tel:${s.contact_phone}`}>{s.contact_phone}</a></p>}
      {s.contact_email&&<p className="footer-contact"><Icon name="mail" size={16}/><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p>}
      {s.website&&<button className="footer-link" onClick={()=>openExternal(s.website)}><Icon name="globe" size={16}/> Website</button>}
    </div>
    <small className="copyright">© {new Date().getFullYear()} SHANO SHAN FRAGRANCE. All rights reserved.</small>
  </footer>;
}

/* =========================================================
   START APP
========================================================= */

createRoot(
  document.getElementById("root")!
).render(<App />);