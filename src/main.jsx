Fimport React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowUpRight, Clock3, RefreshCw, Trophy, Zap, Newspaper, Radio, Menu, X } from "lucide-react";
import "./style.css";

const categories = ["Все новости", "Турниры", "Команды", "Обновления", "Трансферы"];
const fallback = [
  { title: "Новости CS2 скоро появятся здесь", summary: "Лента автоматически загрузит свежие публикации из новостных RSS-источников. Проверьте подключение и настройки GitHub Actions.", source: "CS2 Pulse", category: "Все новости", link: "https://www.counter-strike.net/", published: new Date().toISOString() }
];

function App() {
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState("Все новости");
  const [query, setQuery] = useState("");
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

async function loadNews() {
  setLoading(true);
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}news.json?t=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) throw new Error("news.json недоступен");

    const data = await response.json();
    setNews(Array.isArray(data.articles) ? data.articles : []);
    setUpdated(data.updated_at ?? null);
  } catch (error) {
    console.warn("Ошибка загрузки новостей:", error);
    setNews([]);
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  loadNews();
  const timer = setInterval(loadNews, 30 * 60 * 1000);
  return () => clearInterval(timer);
}, []);

const visible = useMemo(() => {
  const term = query.trim().toLowerCase();

  return news.filter(item => {
    const matchesCategory =
      category === "Все новости" || item.category === category;

    const matchesQuery =
      !term ||
      [item.title, item.summary, item.source]
        .join(" ")
        .toLowerCase()
        .includes(term);

    return matchesCategory && matchesQuery;
  });
}, [news, category, query]);

  const formatDate = value => {
    if (!value) return "Недавно";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Недавно" : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="CS2 Pulse — главная"><span className="brand-mark"><Zap size={19} fill="currentColor"/></span><span>CS2<span className="brand-light">PULSE</span></span></a>
      <nav className="desktop-nav"><a className="active" href="#news">Новости</a><a href="#about">О проекте</a><a href="https://www.counter-strike.net/" target="_blank" rel="noreferrer">Официальный сайт <ArrowUpRight size={14}/></a></nav>
      <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Открыть меню">{mobileOpen ? <X/> : <Menu/>}</button>
      <a className="top-cta" href="#news">Читать новости <ArrowUpRight size={15}/></a>
    </header>
    <AnimatePresence>{mobileOpen && <motion.nav className="mobile-nav" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}><a href="#news" onClick={()=>setMobileOpen(false)}>Новости</a><a href="#about" onClick={()=>setMobileOpen(false)}>О проекте</a></motion.nav>}</AnimatePresence>

    <main>
      <section className="hero">
        <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
        <motion.div className="hero-copy" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.7,ease:"easeOut"}}>
          <div className="eyebrow"><span className="live-dot"/> НОВОСТИ CS2 <span className="eyebrow-line"/></div
          <h1>Вся сцена CS2.<br/><span>В одном месте.</span></h1>
          <p>Главные события Counter-Strike 2 — турниры, составы, обновления и новости киберспорта. Всё самое важное в одном месте.</p>
          <a className="hero-button" href="#news">Смотреть новости <ArrowUpRight size={17}/></a>
        </motion.div>
        <motion.div className="hero-art" initial={{opacity:0,scale:.9,x:25}} animate={{opacity:1,scale:1,x:0}} transition={{duration:.8,delay:.15}}>
          <div className="art-glow"/><div className="art-card card-back"><span>COUNTER-STRIKE</span><b>02</b></div>
          <div className="art-card card-front"><div className="crosshair">✳</div><span>THE COMPETITIVE EDGE</span><strong>PLAY<br/>TO WIN.</strong><small>CS2 / EST. 2023</small></div>
          <div className="float-tag"><Trophy size={15}/> ESPORTS LIVE</div>
        </motion.div>
        <div className="hero-bottom"><span>01 / THE LATEST FROM THE SERVER</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="ticker"><div className="ticker-track"><span>COUNTER-STRIKE 2</span><i>✳️</i><span>НОВОСТИ КИБЕРСПОРТА</span><i>✳️</i><span>ТУРНИРЫ</span><i>✳️</i><span>ПОСЛЕДНИЕ ОБНОВЛЕНИЯ</span><i>✳</i><span>COUNTER-STRIKE 2</span><i>✳️</i><span>НОВОСТИ КИБЕРСПОРТА</span><i>✳️</i><span>ТУРНИРЫ</span><i>✳️</i><span>ПОСЛЕДНИЕ ОБНОВЛЕНИЯ</span><i>✳</i></div></section>

      <section className="news-section" id="news">
        <div className="section-heading"><div><div className="eyebrow purple"><span className="section-number">01</span> ЛЕНТА НОВОСТЕЙ</div><h2>Последние <span>новости</span></h2><p>Всё, что происходит в мире Counter-Strike 2.</p></div><div className="update-box"><span className="update-indicator"/><div><b>АВТООБНОВЛЕНИЕ</b><small>{updated ? "Последнее обновление: " + formatDate(updated) : "Проверяем новости…"}</small></div><button onClick={loadNews} title="Обновить сейчас" aria-label="Обновить новости" className={loading?"spinning":""}><RefreshCw size={17}/></button></div></div>
        <div className="toolbar"><div className="filters">{categories.map(item=><button key={item} onClick={()=>setCategory(item)} className={category===item?"selected":""}>{item}</button>)}</div><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск новостей…"/></label></div>
        {loading && news.length===0 ? <div className="empty-state"><RefreshCw className="spinning"/><p>Загружаем свежие новости…</p></div> :
          <div className="news-grid">
            {visible.map((item,index)=><motion.article className="news-card" key={item.link || item.title} initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.45,delay:(index%3)*.07}}>
              <div className="card-topline"><span className="category-tag">{item.category || "Новости"}</span><span className="card-date"><Clock3 size={13}/> {formatDate(item.published)}</span></div>
              <h3>{item.title}</h3><p>{item.summary || "Откройте публикацию, чтобы прочитать подробности."}</p>
              <div className="card-footer"><span className="source-name"><span className="source-dot"/>{item.source || "Источник"}</span><a href={item.link} target="_blank" rel="noreferrer" aria-label="Читать новость"><ArrowUpRight size={18}/></a></div>
            </motion.article>)}
          </div>}
        {!loading && visible.length===0 && <div className="empty-state"><Newspaper size={28}/><p>{news.length===0 ? "Пока нет новостей. Лента обновится после успешного запуска сборщика." : "По вашему запросу ничего не найдено."}</p></div>}
        <div className="news-footnote"><Radio size={15}/> Новости загружаются из открытых RSS-лент. Полный материал — на сайте первоисточника.</div>
      </section>

      <section className="about-section" id="about"><div className="about-icon"><Zap size={22}/></div><div><div className="eyebrow purple">02 / ABOUT CS2 PULSE</div><h2>В центре <span>игры.</span></h2><p>Независимая новостная лента для тех, кто следит за Counter-Strike 2. Мы собираем публикации из открытых источников и направляем читателя к оригинальным материалам.</p></div><div className="about-stat"><strong>30<span>мин</span></strong><small>ИНТЕРВАЛ ОБНОВЛЕНИЯ</small></div></section>
    </main>
    <footer><a className="brand" href="#"><span className="brand-mark"><Zap size={16} fill="currentColor"/></span><span>CS2<span className="brand-light">PULSE</span></span></a><span>Неофициальный фанатский проект. Не связан с Valve.</span><span>© {new Date().getFullYear()} CS2 PULSE</span></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
