import React,{useEffect,useRef,useState}from'react';import{createRoot}from'react-dom/client';import{Compass,Search,Map,BookOpen}from'lucide-react';import{loadPublicData,updateCountry,addLocation,updateLocation,deleteLocation,updateSettings,addMedia,updateMedia,deleteMedia,addComment}from'./lib/data';import{supabase,hasSupabase}from'./lib/supabase';import'./styles.css';
const phases={phase1:{duration:'SEP - DEC 2026'},phase2:{duration:'JAN - MARCH 2027'}};const byPhase=(a,p)=>a.filter(c=>c.phase===p);const slugify=s=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');const getCountry=(a,id)=>a.find(c=>c.id===id)||a[0];
function Loading(){return <main className="hero-surface"><section className="hero-layout single"><h1>Loading The 210 Project...</h1></section></main>}function useData(){const[data,setData]=useState(null);async function refresh(){const r=await loadPublicData();setData(r);return r}useEffect(()=>{refresh()},[]);return[data,refresh]}
function scrollToHomeTarget(target){setTimeout(()=>{if(target==='ai'){window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});}else{document.getElementById('journey-map')?.scrollIntoView({behavior:'smooth',block:'start'});}window.history.replaceState(null,'','/');sessionStorage.removeItem('homeScrollTarget');},180)}function goHomeTarget(target){sessionStorage.setItem('homeScrollTarget',target);if(window.location.pathname!=='/'){window.location.assign('/');return;}scrollToHomeTarget(target)}
function Crumbs({items}){return <nav className="crumbs"><a href="/">Home</a>{items.map(i=><React.Fragment key={i.href||i.label}> <span>/</span> {i.href?<a href={i.href}>{i.label}</a>:<b>{i.label}</b>}</React.Fragment>)}</nav>}
function BottomNav(){return <nav className="bottom-nav"><button type="button" onClick={()=>goHomeTarget('map')}><Map size={16}/>Map</button><button type="button" onClick={()=>goHomeTarget('ai')}><BookOpen size={16}/>AI</button></nav>}
function statusLabel(c,live){if(c.id===live||c.status==='live')return'LIVE NOW';if(c.status==='visited')return'COMPLETED';return'COMING SOON'}function markerClass(c,selected,currentId){return`marker ${selected?.id===c.id?'selected':''} ${currentId===c.id||c.status==='live'?'current':''} ${c.status==='visited'?'visited':''}`}
function MediaEmbed({mediaItem}){if(!mediaItem)return null;const isVideo=mediaItem.media_type==='video'||/\.(mp4|webm|mov)(\?|$)/i.test(mediaItem.url);return <figure className="embedded-media">{isVideo?<video src={mediaItem.url}controls playsInline preload="metadata"/>:<img src={mediaItem.url}alt={mediaItem.caption||'Travel media'}/>} {mediaItem.caption&&<figcaption>{mediaItem.caption}</figcaption>}</figure>}
function StoryBody({text,media}){const parts=String(text||'').split(/(\[\[(?:photo|media):[a-zA-Z0-9-]+\]\])/g);return <div className="rich-story">{parts.map((part,i)=>{const m=part.match(/\[\[(?:photo|media):([a-zA-Z0-9-]+)\]\]/);if(m){const item=media.find(x=>x.id===m[1]);return item?<MediaEmbed key={part+i}mediaItem={item}/>:<p className="missing-photo"key={part+i}>Missing media: {m[1]}</p>}return part.split('\n').filter(Boolean).map((p,j)=><p key={i+'-'+j}>{p}</p>)})}</div>}
function RouteMap({countries,locations,selected,setSelected,phase,setPhase,currentId}){const shown=byPhase(countries,phase),pos=phase==='phase1'?{colombia:{left:'43%',top:'16%'},peru:{left:'34%',top:'39%'},argentina:{left:'48%',top:'76%'},brazil:{left:'70%',top:'40%'}}:{vietnam:{left:'31%',top:'66%'},'south-korea':{left:'63%',top:'32%'},japan:{left:'82%',top:'38%'},'hong-kong':{left:'53%',top:'55%'},singapore:{left:'41%',top:'80%'}};const locs=locations.filter(l=>l.country_id===selected?.id);return <div className="route-panel"id="journey-map"><div className="phase-tabs"><button className={phase==='phase1'?'on':''}onClick={()=>{setPhase('phase1');setSelected(byPhase(countries,'phase1')[0])}}>Phase 1</button><button className={phase==='phase2'?'on':''}onClick={()=>{setPhase('phase2');setSelected(byPhase(countries,'phase2')[0])}}>Phase 2</button></div><div className="panel-head"><span><Compass size={13}/> INTERACTIVE ROUTE</span><span>{phases[phase].duration}</span></div><div className="map-area"><svg className="route-svg"viewBox="0 0 100 100"preserveAspectRatio="none">{phase==='phase1'?<><path className="land"d="M47 5 C58 7 67 14 70 25 C73 37 66 46 61 55 C57 62 59 68 54 75 C50 83 43 98 37 95 C32 92 35 79 31 69 C27 58 21 47 25 37 C29 28 33 22 34 13 C35 7 40 4 47 5 Z"/><path className="trail"d="M43 16 C36 25 33 34 34 39 C39 52 42 64 48 76 C56 62 65 48 70 40"/></>:<><path className="land asia"d="M14 35 C22 20 38 14 51 17 C61 9 78 14 86 27 C96 43 86 56 72 57 C65 64 60 70 51 72 C44 82 30 84 20 75 C10 65 7 48 14 35 Z M74 27 C86 29 94 39 93 50 C87 44 81 37 74 27 Z M49 70 C54 77 54 86 47 92 C42 83 43 76 49 70 Z"/><path className="trail"d="M31 66 C42 55 52 44 63 31 C70 31 78 35 82 39 C72 44 61 49 54 55 C47 63 43 73 41 80"/></>}</svg>{shown.map((c,i)=><button key={c.id}onClick={()=>setSelected(c)}className={markerClass(c,selected,currentId)}style={pos[c.id]||{left:`${25+i*12}%`,top:'50%'}}><span>{c.status==='visited'?'✓':String(c.route_order).padStart(2,'0')}</span></button>)}</div><div className="map-key"><span className="live-dot"></span> Live <span className="visited-dot"></span> Completed <span className="selected-dot"></span> Selected</div><div className="map-country-strip">{shown.map((c,i) =><button key={c.id}onClick={()=>setSelected(c)}className={`${selected?.id===c.id?'selected':''} ${c.id===currentId||c.status==='live'?'current':''} ${c.status==='visited'?'visited':''}`}><span>{c.status==='visited'?'Completed':String(c.route_order||i+1).padStart(2,'0')}</span><b>{c.name}</b><em>{statusLabel(c,currentId)}</em></button>)}</div><div className="map-country-panel"><p>{statusLabel(selected,currentId)}</p><h3>{selected?.name}</h3>

<div className="panel-actions">
  <a href={`/archive/${selected?.id}`}>Open {selected?.name} Blogs
  </a>
</div>

</div></div>}

function FloatingCompanion({data}){
  const[open,setOpen]=useState(false);

  const[query,setQuery]=useState('');
  const[messages,setMessages]=useState([]);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[loadingMessage,setLoadingMessage]=useState('Checking the journal...');

  const welcomeText='Ask anything about places, stories, highlights and moments from the journey.';

  if(!data)return null;

  const live=data.settings.current_country_id;
  const currentCountry=getCountry(data.countries,live)||data.countries[0];
  const currentCountryName=currentCountry?.name||'the current country';

  const suggestedQuestions=[
    'Where are Jack and Grace now?',
    'What were the highlights in '+currentCountryName+'?',
    'What locations did they visit in '+currentCountryName+'?',
    'What countries come next?',
    'What has been the most memorable moment so far?'
  ];

  const loadingMessages=[
    'Checking the journal...',
    'Looking through travel notes...',
    'Reviewing published stories...',
    'Exploring the route...',
    'Finding the best answer...'
  ];


async function askCompanion(overrideQuestion){
  const question=String(overrideQuestion||query).trim();

  if(!question){
    setError('Ask a question first.');
    return;
  }

  if(!hasSupabase||!supabase){
    setError('AI needs Supabase to be connected first.');
    return;
  }

  setMessages(function(previous){
    return [
      ...previous,
      {
        role:'user',
        text:question
      }
    ];
  });

  setQuery('');
  setBusy(true);
  setError('');
  setLoadingMessage('Checking the journal...');

  try{
    const{data:res,error}=await supabase.functions.invoke(
      'ask-companion',
      {
        body:{
          question:question
        }
      }
    );

    if(error)throw error;

    const reply=res?.answer||'I could not find a published story for that yet.';

    setMessages(function(previous){
      return [
        ...previous,
        {
          role:'assistant',
          text:reply
        }
      ];
    });
  }catch(e){
    const message=e.message||'The AI companion could not answer just now.';

    setError(message);

    setMessages(function(previous){
      return [
        ...previous,
        {
          role:'assistant',
          text:message
        }
      ];
    });
  }finally{
    setBusy(false);
  }
}



return <>
  <button
    className="floating-ai-button"
    type="button"
    onClick={()=>setOpen(true)}
  >
    AI
  </button>

  {open && (
    <div className="floating-ai-overlay">
      <div
        className="floating-ai-backdrop"
        onClick={()=>setOpen(false)}
      ></div>

      <section className="floating-ai-panel">
        <div className="floating-ai-head">
          <div>
            <p>THE 210 COMPANION</p>
            <h2>Ask about the journey.</h2>
          </div>

          <button
            type="button"
            onClick={()=>setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="floating-chat-body">
          {messages.length === 0 && (
            <div className="floating-ai-intro">
              <p>{welcomeText}</p>

              <div className="floating-suggested-questions">
                <p>Try asking</p>

                {suggestedQuestions.map(function(item){
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={()=>{
                        askCompanion(item);
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="floating-chat-messages">
              {messages.map(function(message,index){
                return (
                  <div
                    key={index}
                    className={
                      message.role === 'user'
                        ? 'chat-message chat-user'
                        : 'chat-message chat-assistant'
                    }
                  >
                    <span>
                      {message.role === 'user' ? 'You' : 'The 210 Companion'}
                    </span>

                    <p>{message.text}</p>
                  </div>
                );
              })}

              {busy && (
                <div className="chat-message chat-assistant">
                  <span>The 210 Companion</span>
                  <p>{loadingMessage}</p>
                </div>
              )}

              {error && (
                <small className="ai-error">
                  {error}
                </small>
              )}
            </div>
          )}
        </div>

        <div className="floating-ask-bar">
          <Search size={15}/>

          <input
            value={query}
            placeholder="Ask about the journey..."
            onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{
              if(e.key === 'Enter') askCompanion();
            }}
          />

          <button
            type="button"
            onClick={()=>askCompanion()}
            disabled={busy}
          >
            {busy ? '...' : '>'}
          </button>
        </div>
      </section>
    </div>
  )}
</>;
}  



function SiteMenu({data}){
  const [open,setOpen] = useState(false);

  if(!data) return null;

  const countries = [...(data.countries || [])].sort(function(a,b){
    return (a.route_order || 99) - (b.route_order || 99);
  });

  function goHome(){
    setOpen(false);

    if(window.location.pathname !== '/'){
      window.location.assign('/');
    }
  }

  function goToMap(){
    setOpen(false);

    if(window.location.pathname !== '/'){
      sessionStorage.setItem('homeScrollTarget','map');
      window.location.assign('/');
      return;
    }

    document.getElementById('journey-map')?.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  }

function goToLatestStory(){
  setOpen(false);

  const latest =
    data.locations
      .filter(l => l.is_published !== false)
      .sort((a,b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
      )[0];

  if(!latest) return;

  window.location.assign(
    '/archive/' +
    latest.country_id +
    '/' +
    latest.slug
  );
}

  function goToCountry(countryId){
    setOpen(false);
    window.location.assign('/archive/' + countryId);
  }

  const countryItems = countries.map(function(country){
    const hasLocations = (data.locations || []).some(function(location){
      return location.country_id === country.id;
    });

    const isAvailable =
      hasLocations &&
      (
        country.status === 'visited' ||
        country.status === 'live' ||
        country.id === data.settings.current_country_id
      );

    const label =
      String(country.route_order || '').padStart(2,'0') +
      ' / ' +
      country.name;

    if(isAvailable){
      return React.createElement(
        'button',
        {
          key: country.id,
          type: 'button',
          onClick: function(){
            goToCountry(country.id);
          }
        },
        label
      );
    }

    return React.createElement(
      'div',
      {
        key: country.id,
        className: 'menu-disabled'
      },
      label,
      React.createElement('small', null, 'Coming soon')
    );
  });

  return React.createElement(
    React.Fragment,
    null,

    React.createElement(
      'button',
      {
        className: 'hamburger-button',
        type: 'button',
        onClick: function(){
          setOpen(true);
        },
        'aria-label': 'Open menu'
      },
      '☰'
    ),

    open
      ? React.createElement(
          'div',
          {
            className: 'menu-overlay',
            onClick: function(){
              setOpen(false);
            }
          },

          React.createElement(
            'aside',
            {
              className: 'site-menu',
              onClick: function(e){
                e.stopPropagation();
              }
            },

            React.createElement(
              'div',
              {
                className: 'site-menu-head'
              },

              React.createElement(
  'h2',
  {
    className:'menu-title'
  },
  'THE 210 PROJECT'
),

              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: function(){
                    setOpen(false);
                  }
                },
                'x'
              )
            ),

            React.createElement(
              'div',
              {
                className: 'site-menu-links'
              },

              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: goHome
                },
                'Home'
              ),

              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: goToMap
                },
                'Journey Map'
              ),

              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: goToLatestStory
                },
                'Latest Story'
              ),

		React.createElement(
  'button',
  {
    type: 'button',
    onClick: function(){
      setOpen(false);
      window.location.assign('/gallery');
    }
  },
  'Gallery'
),

              React.createElement(
                'div',
                {
                  className: 'menu-country-group'
                },

                React.createElement(
  'span',
  {
    className:'menu-section-title'
  },
  'Countries'
),

                countryItems
              )
            )
          )
        )
      : null
  );
}

function Home(){const[data]=useData();const[query,setQuery]=useState('What changed in Peru?');const[aiAnswer,setAiAnswer]=useState('Ask me anything about the journey and I will answer using the published archive.');const[aiBusy,setAiBusy]=useState(false);const[aiError,setAiError]=useState('');const[loadingMessage,setLoadingMessage]=useState('Checking the journal...');const[phase,setPhase]=useState('phase1');const[selected,setSelected]=useState(null);useEffect(()=>{if(data&&!selected){const startPhase=data.settings.default_phase||'phase1';const current=getCountry(data.countries,data.settings.current_country_id);const initial=current.phase===startPhase?current:(byPhase(data.countries,startPhase)[0]||current);setSelected(initial);setPhase(startPhase)}},[data,selected]);useEffect(()=>{if(data&&selected){const target=sessionStorage.getItem('homeScrollTarget');if(target)scrollToHomeTarget(target)}},[data,selected]);if(!data||!selected)return <Loading/>;const menu = <SiteMenu data={data} />;const live=data.settings.current_country_id;const currentCountry=getCountry(data.countries,live)||selected;const liveLocation=(data.locations||[]).find(function(location){return location.is_live===true});const currentCountryName=currentCountry?.name||'the current country';const currentLocationName=liveLocation?.name||currentCountry?.current_location||'the latest stop';const suggestedQuestions = [
  'Where are Jack and Grace now?',
  'What were the highlights in ' + currentCountryName + '?',
  'What locations did they visit in ' + currentCountryName + '?',
  'What countries come next?',
  'Summarise their journey so far?'
];
const loadingMessages=[
  'Checking the journal...',
  'Looking through travel notes...',
  'Reviewing published stories...',
  'Exploring the route...',
  'Finding the best answer...'
];async function askCompanion(overrideQuestion){const question=String(overrideQuestion||query).trim();if(!question){setAiError('Ask a question first.');return}if(!hasSupabase||!supabase){setAiError('AI needs Supabase to be connected first.');return}setAiBusy(true);setLoadingMessage(loadingMessages[Math.floor(Math.random()*loadingMessages.length)]);setAiError('');try{const{data:res,error}=await supabase.functions.invoke('ask-companion',{body:{question}});if(error)throw error;setAiAnswer(res?.answer||'I could not find a published story for that yet.')}catch(e){setAiError(e.message||'The AI companion could not answer just now.')}finally{setAiBusy(false)}}return <><main className="hero-surface"><section className="hero-layout"><div className="hero-copy"><p className="kicker"><i/> LIVE TRAVEL ARCHIVE</p><h1><span>The</span><em>210</em><span>Project</span></h1><p className="lead">Jack and Grace's live travel journal, where we will document our experiences in South America and Asia over 210 days!</p>{data.usingFallback&&<p className="setup-note">Running on fallback data. Connect Supabase to make it live.</p>}</div><RouteMap countries={data.countries}locations={data.locations}selected={selected}setSelected={setSelected}phase={phase}setPhase={setPhase}currentId={live}/></section></main><LatestStory data={data}/>

<Footer/><FloatingCompanion data={data}/><BottomNav/></>}
function getLatestStory(data){const locs=[...(data.locations||[])];if(!locs.length)return null;const current=locs.find(l=>l.country_id===data.settings.current_country_id&&l.slug===data.settings.current_location_slug);const sorted=[...locs].sort((a,b)=>String(b.created_at||b.updated_at||b.date_text||'').localeCompare(String(a.created_at||a.updated_at||a.date_text||'')));const loc=current||sorted[0]||locs[locs.length-1];const country=getCountry(data.countries,loc.country_id);return{loc,country}}
function LatestStory({data}){const latest=getLatestStory(data);if(!latest)return null;const{loc,country}=latest;return <section className="story-section latest-story-section"><div className="section-inner latest-story-inner"><div><p className="kicker dark"><i/> LATEST STORY</p><h2>{loc.name}</h2><p>{loc.summary||'The next story from the journey will appear here.'}</p><div className="latest-meta"><span>{country?.name}</span>{loc.date_text&&<span>{loc.date_text}</span>}
</div>


<div className="latest-subscribe">

  <span className="latest-subscribe-text">
    Get email notifications when a new story is published.
  </span>

  <button
    type="button"
    className="latest-subscribe-button"
    onClick={() => setShowSubscribe(true)}
  >
    Subscribe
  </button>

</div>


</div><a className="latest-card"href={`/archive/${country.id}/${loc.slug}`}><span>Read latest entry</span><strong>{loc.name}</strong><small>{country?.name}</small></a></div></section>}


function NewsletterSignup() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function subscribe() {
    const emailAddress = email.trim();

    if (!emailAddress) {
      setMessage('Please enter an email address.');
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailAddress)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    try {
      setBusy(true);

      const { error } = await supabase.functions.invoke(
        'subscribe',
        {
          body: {
            email: emailAddress
          }
        }
      );

      if (error) {
        throw error;
      }

      setEmail('');
      setMessage(
        '✅ Subscription confirmed. We will email you when a new story is published.'
      );

    } catch (error) {
      setMessage(
        error.message || 'Subscription failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="story-section newsletter-section">
      <div className="section-inner newsletter-inner">

        <p className="kicker dark">
          <i /> FOLLOW THE JOURNEY
        </p>

        <h2>Never miss a story.</h2>

        <p>
          Get email notifications whenever Jack and Grace
          publish a new story, gallery or travel update.
        </p>

        <button
          type="button"
          className="newsletter-button"
          onClick={() => setShowSubscribe(true)}
        >
          Subscribe
        </button>

        {showSubscribe && (
          <div
            className="newsletter-modal"
            onClick={() => setShowSubscribe(false)}
          >
            <div
              className="newsletter-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Get Journey Updates</h3>

              <p>
                Enter your email address and we'll notify
                you whenever a new story is published.
              </p>

              <input
                type="email"
                value={email}
                placeholder="your@email.com"
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                type="button"
                onClick={subscribe}
                disabled={busy}
              >
                {busy ? 'Subscribing...' : 'Subscribe'}
              </button>

              {message && (
                <small>{message}</small>
              )}

              <button
                type="button"
                className="newsletter-close"
                onClick={() => setShowSubscribe(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

function ArchiveTimeline({data}){const[open,setOpen]=useState(data.settings.current_country_id||data.countries[0]?.id);return <section className="story-section archive-timeline-section"id="archive"><div className="section-inner"><div className="archive-head"><div><p className="kicker dark"><i/> ARCHIVE TIMELINE</p><h2>The journey, in order.</h2><p>Expand a country to jump straight into its locations without digging through extra pages.</p></div><div className="archive-status-key"><span className="status-key live">Live</span><span className="status-key visited">Completed</span><span className="status-key upcoming">Coming soon</span></div></div><div className="timeline-list">{data.countries.map(c=>{const locs=data.locations.filter(l=>l.country_id===c.id);const isOpen=open===c.id;const label=statusLabel(c,data.settings.current_country_id);return <article key={c.id}className={`timeline-card ${c.status==='visited'?'visited':c.status==='live'||c.id===data.settings.current_country_id?'live':'upcoming'} ${isOpen?'open':''}`}><div className="timeline-marker"><span>{String(c.route_order||'').padStart(2,'0')}</span></div><div className="timeline-body"><button className="timeline-toggle"onClick={()=>setOpen(isOpen?null:c.id)}><span className="timeline-date">{c.dates||phases[c.phase]?.duration}</span><strong>{c.name}</strong><em className={`timeline-status ${c.status==='visited'?'visited':c.status==='live'||c.id===data.settings.current_country_id?'live':'upcoming'}`}>{label}</em><b>{isOpen?'-':'+'}</b></button>{isOpen&&<div className="timeline-drawer"><p>{c.summary}</p>{locs.length?<div className="timeline-locations">{locs.map(l=><a key={l.id}href={`/archive/${c.id}/${l.slug}`}><span>{l.date_text||'Story'}</span><strong>{l.name}</strong><small>{l.summary||'Open story'} ’</small></a>)}</div>:<p className="hint">Stories coming soon for this country.</p>}<a className="chapter-link"href={`/archive/${c.id}`}>Open {c.name} chapter’</a></div>}</div></article>})}</div></div></section>}

function GalleryIndex(){
  const [data] = useData();
  const [activeIndex,setActiveIndex] = useState(null);

  const galleryItems = [];

  if(data){
    (data.countries || []).forEach(function(country){
      (data.locations || [])
        .filter(function(location){
          return location.country_id === country.id;
        })
        .forEach(function(location){
          (data.media || [])
            .filter(function(media){
              return media.location_id === location.id;
            })
            .forEach(function(media){
              galleryItems.push({
                id: media.id,
                url: media.url,
                caption: media.caption || '',
                media_type: media.media_type,
                countryName: country.name,
                locationName: location.name
              });
            });
        });
    });
  }

  useEffect(function(){
    function handleKey(event){
      if(activeIndex === null) return;

      if(event.key === 'Escape'){
        setActiveIndex(null);
      }

      if(event.key === 'ArrowRight'){
        setActiveIndex(function(current){
          return (current + 1) % galleryItems.length;
        });
      }

      if(event.key === 'ArrowLeft'){
        setActiveIndex(function(current){
          return (current - 1 + galleryItems.length) % galleryItems.length;
        });
      }
    }

    window.addEventListener('keydown', handleKey);

    return function(){
      window.removeEventListener('keydown', handleKey);
    };
  }, [activeIndex, galleryItems.length]);

  if(!data) return React.createElement(Loading, null);

  const activeItem =
    activeIndex !== null
      ? galleryItems[activeIndex]
      : null;

  function openItem(itemId){
    const index = galleryItems.findIndex(function(item){
      return item.id === itemId;
    });

    if(index >= 0){
      setActiveIndex(index);
    }
  }

  function previousItem(){
    setActiveIndex(function(current){
      return (current - 1 + galleryItems.length) % galleryItems.length;
    });
  }

  function nextItem(){
    setActiveIndex(function(current){
      return (current + 1) % galleryItems.length;
    });
  }

  return React.createElement(
    React.Fragment,
    null,

    React.createElement(
      'main',
      {
        className: 'hero-surface country-hero'
      },
      React.createElement(
        'section',
        {
          className: 'country-hero-inner'
        },

        React.createElement(Crumbs, {
          items: [{ label: 'Photo Gallery' }]
        }),

        React.createElement(
          'p',
          {
            className: 'kicker'
          },
          React.createElement('i', null),
          ' PHOTO GALLERY'
        ),

        React.createElement(
          'h1',
          null,
          'Journey Gallery'
        ),

        React.createElement(
          'p',
          {
            className: 'lead'
          },
          'Browse every photo and video from the journey, organised by country and location.'
        )
      )
    ),

    React.createElement(
      'section',
      {
        className: 'story-section'
      },
      React.createElement(
        'div',
        {
          className: 'section-inner'
        },

        (data.countries || []).map(function(country){
          const locations = (data.locations || []).filter(function(location){
            return location.country_id === country.id;
          });

          const locationsWithMedia = locations.filter(function(location){
            return (data.media || []).some(function(media){
              return media.location_id === location.id;
            });
          });

          if(!locationsWithMedia.length) return null;

          return React.createElement(
            'div',
            {
              key: country.id,
              className: 'gallery-country'
            },

            React.createElement(
              'h2',
              null,
              country.name
            ),

            locationsWithMedia.map(function(location){
              const media = (data.media || []).filter(function(item){
                return item.location_id === location.id;
              });

              return React.createElement(
                'div',
                {
                  key: location.id,
                  className: 'gallery-location'
                },

                React.createElement(
                  'h3',
                  null,
                  location.name
                ),

                React.createElement(
                  'div',
                  {
                    className: 'gallery-preview-grid'
                  },

                  media.slice(0,8).map(function(item){
                    const isVideo =
                      item.media_type === 'video' ||
                      /\.(mp4|webm|mov)(\?|$)/i.test(item.url);

                    return React.createElement(
                      'button',
                      {
                        key: item.id,
                        type: 'button',
                        className: 'gallery-thumb-button',
                        onClick: function(){
                          openItem(item.id);
                        }
                      },

                      React.createElement(
                        'figure',
                        null,

                        isVideo
                          ? React.createElement(
                              'video',
                              {
                                src: item.url,
                                muted: true,
                                playsInline: true,
                                preload: 'metadata'
                              }
                            )
                          : React.createElement(
                              'img',
                              {
                                src: item.url,
                                alt: item.caption || location.name
                              }
                            ),

                        item.caption
                          ? React.createElement(
                              'figcaption',
                              null,
                              item.caption
                            )
                          : null
                      )
                    );
                  })
                )
              );
            })
          );
        })
      )
    ),

    activeItem
      ? React.createElement(
          'div',
          {
            className: 'gallery-lightbox',
            onClick: function(){
              setActiveIndex(null);
            }
          },

          React.createElement(
            'section',
            {
              className: 'gallery-lightbox-card',
              onClick: function(event){
                event.stopPropagation();
              }
            },

            React.createElement(
              'button',
              {
                type: 'button',
                className: 'gallery-lightbox-close',
                onClick: function(){
                  setActiveIndex(null);
                }
              },
              '×'
            ),

            React.createElement(
              'button',
              {
                type: 'button',
                className: 'gallery-lightbox-arrow gallery-lightbox-prev',
                onClick: previousItem
              },
              '‹'
            ),

            React.createElement(
              'div',
              {
                className: 'gallery-lightbox-media'
              },

              activeItem.media_type === 'video' ||
              /\.(mp4|webm|mov)(\?|$)/i.test(activeItem.url)
                ? React.createElement(
                    'video',
                    {
                      src: activeItem.url,
                      controls: true,
                      playsInline: true
                    }
                  )
                : React.createElement(
                    'img',
                    {
                      src: activeItem.url,
                      alt: activeItem.caption || activeItem.locationName
                    }
                  )
            ),

            React.createElement(
              'button',
              {
                type: 'button',
                className: 'gallery-lightbox-arrow gallery-lightbox-next',
                onClick: nextItem
              },
              '›'
            ),

            React.createElement(
              'div',
              {
                className: 'gallery-lightbox-caption'
              },

              React.createElement(
                'strong',
                null,
                activeItem.locationName
              ),

              React.createElement(
                'span',
                null,
                activeItem.countryName
              ),

              activeItem.caption
                ? React.createElement(
                    'p',
                    null,
                    activeItem.caption
                  )
                : null
            )
          )
        )
      : null
  );
}

function CountryPage({id}){const[data]=useData();if(!data)return <Loading/>;const country=getCountry(data.countries,id),locs=data.locations.filter(l=>l.country_id===country.id);return <>
<main className="hero-surface country-hero"><section className="country-hero-inner"><Crumbs items={[{label:country.name}]}/><p className="kicker"><i/> COUNTRY CHAPTER</p><h1>{country.name}</h1><p className="lead">{country.summary}</p></section></main>
<section className="story-section"><div className="section-inner country-template"><section><p className="kicker dark"><i/> LOCATIONS VISITED</p><div className="location-grid">{locs.map(l=><a key={l.id}href={`/archive/${country.id}/${l.slug}`}><img src={l.hero_image}alt={l.name}/><div><span>{l.date_text}</span><h3>{l.name}</h3><p>{l.summary}</p></div></a>)}</div></section></div></section><BottomNav/></>}
function LocationPage({countryId,slug,gallery=false}){const[data,refresh]=useData();if(!data)return <Loading/>;const country=getCountry(data.countries,countryId),loc=data.locations.find(l=>l.country_id===country.id&&l.slug===slug)||{},media=data.media.filter(m=>m.location_id===loc.id),comments=data.comments.filter(c=>c.location_id===loc.id);if(gallery)return <GalleryPage country={country}loc={loc}media={media}/>;return <><main className="hero-surface location-hero"><section className="detail-layout"><div><Crumbs items={[{label:country.name,href:`/archive/${country.id}`},{label:loc.name||slug}]}/><p className="kicker"><i/> LOCATION STORY</p><h1>{loc.name||slug}</h1><p className="lead">{loc.summary}</p></div><div className="detail-image">
  {loc.hero_image && React.createElement(
    'img',
    {
      src: loc.hero_image,
      alt: loc.name || slug
    }
  )}
  <b>{country.name} - {loc.date_text || ''}</b>
</div></section></main><section className="story-section"><div className="section-inner story-template"><p className="kicker dark"><i/> THE STORY</p><StoryBody text={loc.blog}media={media}/>{media.length>0&&<a className="gallery-link"href={`/archive/${country.id}/${loc.slug}/gallery`}>View all photos and videos</a>}<Comments locationId={loc.id}comments={comments}refresh={refresh}/></div></section><BottomNav/></>}

function GalleryPage({country,loc,media}){
  const [activeIndex,setActiveIndex] = useState(null);

  useEffect(function(){
    function handleKey(event){
      if(activeIndex === null) return;

      if(event.key === 'Escape'){
        setActiveIndex(null);
      }

      if(event.key === 'ArrowRight'){
        setActiveIndex(function(current){
          return (current + 1) % media.length;
        });
      }

      if(event.key === 'ArrowLeft'){
        setActiveIndex(function(current){
          return (current - 1 + media.length) % media.length;
        });
      }
    }

    window.addEventListener('keydown',handleKey);

    return function(){
      window.removeEventListener('keydown',handleKey);
    };
  },[activeIndex,media.length]);

  const activeItem =
    activeIndex !== null
      ? media[activeIndex]
      : null;

  function openItem(index){
    setActiveIndex(index);
  }

  function previousItem(){
    setActiveIndex(function(current){
      return (current - 1 + media.length) % media.length;
    });
  }

  function nextItem(){
    setActiveIndex(function(current){
      return (current + 1) % media.length;
    });
  }

  return React.createElement(
    React.Fragment,
    null,

    React.createElement(
      'main',
      {
        className:'hero-surface country-hero'
      },

      React.createElement(
        'section',
        {
          className:'country-hero-inner'
        },

        React.createElement(Crumbs,{
          items:[
            {
              label:country.name,
              href:'/archive/' + country.id
            },
            {
              label:loc.name,
              href:'/archive/' + country.id + '/' + loc.slug
            },
            {
              label:'Gallery'
            }
          ]
        }),

        React.createElement(
          'p',
          {
            className:'kicker'
          },
          React.createElement('i',null),
          ' MEDIA GALLERY'
        ),

        React.createElement(
          'h1',
          null,
          loc.name
        ),

        React.createElement(
          'p',
          {
            className:'lead'
          },
          'All photos and videos uploaded for this location.'
        )
      )
    ),

    React.createElement(
      'section',
      {
        className:'story-section'
      },

      React.createElement(
        'div',
        {
          className:'section-inner gallery-grid'
        },

        media.map(function(item,index){
          const isVideo =
            item.media_type === 'video' ||
            /\.(mp4|mov|webm)(\?|$)/i.test(item.url);

          return React.createElement(
            'button',
            {
              key:item.id,
              type:'button',
              className:'gallery-thumb-button',
              onClick:function(){
                openItem(index);
              }
            },

            React.createElement(
              'figure',
              null,

              isVideo
                ? React.createElement(
                    'video',
                    {
                      src:item.url,
                      muted:true,
                      playsInline:true,
                      preload:'metadata'
                    }
                  )
                : React.createElement(
                    'img',
                    {
                      src:item.url,
                      alt:item.caption || loc.name
                    }
                  ),

              item.caption
                ? React.createElement(
                    'figcaption',
                    null,
                    item.caption
                  )
                : null
            )
          );
        })
      )
    ),

    activeItem
      ? React.createElement(
          'div',
          {
            className:'gallery-lightbox',
            onClick:function(){
              setActiveIndex(null);
            }
          },

          React.createElement(
            'section',
            {
              className:'gallery-lightbox-card',
              onClick:function(event){
                event.stopPropagation();
              }
            },

            React.createElement(
              'button',
              {
                type:'button',
                className:'gallery-lightbox-close',
                onClick:function(){
                  setActiveIndex(null);
                }
              },
              'x'
            ),

            React.createElement(
              'button',
              {
                type:'button',
                className:'gallery-lightbox-arrow gallery-lightbox-prev',
                onClick:previousItem
              },
              '<'
            ),

            React.createElement(
              'div',
              {
                className:'gallery-lightbox-media'
              },

              activeItem.media_type === 'video' ||
              /\.(mp4|mov|webm)(\?|$)/i.test(activeItem.url)
                ? React.createElement(
                    'video',
                    {
                      src:activeItem.url,
                      controls:true,
                      playsInline:true
                    }
                  )
                : React.createElement(
                    'img',
                    {
                      src:activeItem.url,
                      alt:activeItem.caption || loc.name
                    }
                  )
            ),

            React.createElement(
              'button',
              {
                type:'button',
                className:'gallery-lightbox-arrow gallery-lightbox-next',
                onClick:nextItem
              },
              '>'
            ),

            React.createElement(
              'div',
              {
                className:'gallery-lightbox-caption'
              },

              React.createElement(
                'strong',
                null,
                loc.name
              ),

              React.createElement(
                'span',
                null,
                country.name
              ),

              activeItem.caption
                ? React.createElement(
                    'p',
                    null,
                    activeItem.caption
                  )
                : null,

              React.createElement(
                'p',
                {
                  className:'gallery-lightbox-count'
                },
                String(activeIndex + 1) + ' / ' + String(media.length)
              )
            )
          )
        )
      : null,

    React.createElement(BottomNav,null)
  );
}

function Comments({locationId,comments,refresh}){const[name,setName]=useState(''),[comment,setComment]=useState(''),[replyTo,setReplyTo]=useState(null),[replyName,setReplyName]=useState(''),[replyText,setReplyText]=useState(''),[msg,setMsg]=useState('');async function post(parent_id=null){const n=parent_id?replyName:name,t=parent_id?replyText:comment;if(!n.trim()||!t.trim()){setMsg('Please add a name and comment.');return}const res=await addComment({location_id:locationId,parent_id,name:n.trim(),comment:t.trim()});if(res.error){setMsg(res.error.message);return}setName('');setComment('');setReplyName('');setReplyText('');setReplyTo(null);setMsg('Comment added.');refresh()}const roots=comments.filter(c=>!c.parent_id);const replies=id=>comments.filter(c=>c.parent_id===id);return <section className="comments"><p className="kicker dark"><i/> COMMENTS</p><div className="comment-form"><input placeholder="Name"value={name}onChange={e=>setName(e.target.value)}/><textarea placeholder="Comment"value={comment}onChange={e=>setComment(e.target.value)}/><button onClick={()=>post()}>Post comment</button>{msg&&<small>{msg}</small>}</div>{roots.map(c=><article className="comment"key={c.id}><b>{c.name}</b><p>{c.comment}</p><button onClick={()=>setReplyTo(replyTo===c.id?null:c.id)}>Reply</button>{replyTo===c.id&&<div className="reply-form"><input placeholder="Name"value={replyName}onChange={e=>setReplyName(e.target.value)}/><textarea placeholder="Reply"value={replyText}onChange={e=>setReplyText(e.target.value)}/><button onClick={()=>post(c.id)}>Post reply</button></div>}{replies(c.id).map(r=><div className="reply"key={r.id}><b>{r.name}</b><p>{r.comment}</p></div>)}</article>)}</section>}
function Admin(){const[data,refresh]=useData();const[session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(''),[fileItems,setFileItems]=useState([]),[uploadedNow,setUploadedNow]=useState([]);const mediaRef=useRef(null);const blogRef=useRef(null);const empty={country_id:'peru',id:'',name:'',slug:'',date_text:'',summary:'',blog:''};const[location,setLocation]=useState(empty),[countryEdit,setCountryEdit]=useState({id:'peru',current_location:'',status:'live',summary:''}),[defaultPhase,setDefaultPhase]=useState('phase1');useEffect(()=>{if(msg){const t=setTimeout(()=>setMsg(''),4500);return()=>clearTimeout(t)}},[msg]);useEffect(()=>{if(data?.settings?.default_phase)setDefaultPhase(data.settings.default_phase);if(data?.countries?.length&&!countryEdit.summary&&!countryEdit.current_location){const c=getCountry(data.countries,data.settings.current_country_id||'peru');setCountryEdit({id:c.id,current_location:c.current_location||'',status:c.status||'upcoming',summary:c.summary||''})}},[data]);useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const{data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>sub.subscription.unsubscribe()},[]);if(!data)return <Loading/>;const sortedCountries=[...data.countries].sort((a,b)=>(a.route_order||99)-(b.route_order||99)||a.name.localeCompare(b.name));const sortedLocations=[...data.locations].sort((a,b)=>{const ca=sortedCountries.findIndex(c=>c.id===a.country_id);const cb=sortedCountries.findIndex(c=>c.id===b.country_id);return ca-cb||(a.sort_order||99)-(b.sort_order||99)||a.name.localeCompare(b.name)});const locMedia=[...new globalThis.Map([...data.media,...uploadedNow].filter(m=>m.location_id===location.id).map(m=>[m.id,m])).values()];function pickLocation(id){const l=data.locations.find(x=>x.id===id);if(!l){setLocation(empty);setUploadedNow([]);return}setLocation({...l});setUploadedNow([])}function selectFiles(fileList){setFileItems([...fileList].map(file=>({file,caption:''})))}async function copyToken(id){await navigator.clipboard.writeText(`[[media:${id}]]`);setMsg('Token copied')}async function signIn(e){e.preventDefault();if(!hasSupabase){setMsg('Supabase is not configured yet.');return}const{error}=await supabase.auth.signInWithPassword({email,password});setMsg(error?error.message:'Signed in')}async function saveLive(){try{setBusy('live');await updateSettings({current_country_id:countryEdit.id,current_location_slug:slugify(countryEdit.current_location),default_phase:defaultPhase});await updateCountry({id:countryEdit.id,status:'live',current_location:countryEdit.current_location,summary:countryEdit.summary});setMsg('Live location updated');refresh()}catch(e){setMsg(e.message)}finally{setBusy('')}}async function saveCountry(){try{setBusy('country');const res=await updateCountry({id:countryEdit.id,current_location:countryEdit.current_location,status:countryEdit.status,summary:countryEdit.summary});if(res.error)throw res.error;await updateSettings({current_country_id:data.settings.current_country_id,current_location_slug:data.settings.current_location_slug,default_phase:defaultPhase});setMsg('Status and default phase saved');refresh()}catch(e){setMsg(e.message)}finally{setBusy('')}}async function saveLocation(){try{setBusy('location');const payload={...location,slug:location.slug||slugify(location.name),sort_order:99,is_published:true};delete payload.tags;delete payload.highlights;const isEditing=Boolean(payload.id);if(!isEditing)delete payload.id;let res=isEditing?await updateLocation(payload):await addLocation(payload);if(res.error)throw res.error;let loc=res.data;setLocation(l=>({...l,...loc}));const newMedia=[];if(fileItems.length&&hasSupabase){for(const item of fileItems){const file=item.file;const isVideo=file.type.startsWith('video/');const path=`${loc.country_id}/${loc.slug}/${Date.now()}-${file.name}`;const up=await supabase.storage.from('trip-media').upload(path,file,{upsert:true,contentType:file.type});if(up.error)throw up.error;const pub=supabase.storage.from('trip-media').getPublicUrl(path).data.publicUrl;const mediaRes=await addMedia({location_id:loc.id,url:pub,file_path:path,caption:item.caption||file.name,media_type:isVideo?'video':'photo'});if(mediaRes.error)throw mediaRes.error;newMedia.push(mediaRes.data);if(!loc.hero_image&&!isVideo){await updateLocation({...loc,hero_image:pub});loc={...loc,hero_image:pub}}}}if(newMedia.length){setUploadedNow(prev=>[...prev,...newMedia]);setTimeout(()=>mediaRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),250)}setMsg(isEditing?'Location updated':'Location published');setFileItems([]);refresh()}catch(e){setMsg(e.message)}finally{setBusy('')}}async function removeLocation(){if(!location.id)return;if(!window.confirm(`Delete ${location.name}?`))return;try{setBusy('delete');const res=await deleteLocation(location.id);if(res.error)throw res.error;setLocation(empty);setUploadedNow([]);setMsg('Location deleted');refresh()}catch(e){setMsg(e.message)}finally{setBusy('')}}async function setHero(url){if(!location.id)return;try{await updateLocation({...location,hero_image:url});setLocation({...location,hero_image:url});setMsg('Hero image updated');refresh()}catch(e){setMsg(e.message)}}async function saveCaption(m,caption){try{const res=await updateMedia({id:m.id,caption});if(res.error)throw res.error;setUploadedNow(prev=>prev.map(x=>x.id===m.id?{...x,caption}:x));setMsg('Caption saved');refresh()}catch(e){setMsg(e.message)}}async function removeMedia(m){if(!window.confirm('Delete this media item?'))return;try{if(m.file_path&&hasSupabase)await supabase.storage.from('trip-media').remove([m.file_path]);const res=await deleteMedia(m.id);if(res.error)throw res.error;setUploadedNow(prev=>prev.filter(x=>x.id!==m.id));setMsg('Media deleted');refresh()}catch(e){setMsg(e.message)}}return <><main className="admin-page"><section className="admin-shell"><a href="/"className="back-link">Back to public site</a><p className="kicker dark"><i/> PRIVATE ADMIN</p><h1>Manage The 210 Project.</h1>{!session?<form className="admin-card login"onSubmit={signIn}><label>Email</label><input value={email}onChange={e=>setEmail(e.target.value)}/><label>Password</label><input type="password"value={password}onChange={e=>setPassword(e.target.value)}/><button>Sign in</button></form>:<div className="admin-grid"><div className="admin-card"><h2>Country and map settings</h2><label>Country</label><select value={countryEdit.id}onChange={e=>{const c=getCountry(data.countries,e.target.value);setCountryEdit({id:c.id,current_location:c.current_location||'',status:c.status||'upcoming',summary:c.summary||''})}}>{sortedCountries.map(c=><option key={c.id}value={c.id}>{String(c.route_order||'').padStart(2,'0')} / {c.name}</option>)}</select><label>Status</label><select value={countryEdit.status}onChange={e=>setCountryEdit({...countryEdit,status:e.target.value})}><option value="upcoming">Upcoming / grey</option><option value="live">Live / yellow</option><option value="visited">Completed / green tick</option></select><label>Default homepage map phase</label><select value={defaultPhase}onChange={e=>setDefaultPhase(e.target.value)}><option value="phase1">Phase 1</option><option value="phase2">Phase 2</option></select><label>Current location</label><input value={countryEdit.current_location}onChange={e=>setCountryEdit({...countryEdit,current_location:e.target.value})}/><label>Country chapter summary</label><textarea value={countryEdit.summary||''}onChange={e=>setCountryEdit({...countryEdit,summary:e.target.value})}/><button className={busy==='live'?'busy':''}onClick={saveLive}>{busy==='live'?'Saving...':'Set live location'}</button><button className={busy==='country'?'busy':''}onClick={saveCountry}>{busy==='country'?'Saving...':'Save status/default phase'}</button></div><div className="admin-card"><h2>Add or edit location</h2><label>Edit existing location</label><select value={location.id||''}onChange={e=>pickLocation(e.target.value)}><option value="">New location</option>{sortedLocations.map(l=>{const c=getCountry(sortedCountries,l.country_id);return <option key={l.id}value={l.id}>{String(c.route_order||'').padStart(2,'0')} / {c.name} / {l.name}</option>})}</select><label>Country</label><select value={location.country_id}onChange={e=>setLocation({...location,country_id:e.target.value})}>{sortedCountries.map(c=><option key={c.id}value={c.id}>{String(c.route_order||'').padStart(2,'0')} / {c.name}</option>)}</select><label>Location name</label><input value={location.name}onChange={e=>setLocation({...location,name:e.target.value,slug:slugify(e.target.value)})}/><label>Slug</label><input value={location.slug}onChange={e=>setLocation({...location,slug:e.target.value})}/><label>Date</label><input value={location.date_text||''}onChange={e=>setLocation({...location,date_text:e.target.value})}/><label>Summary</label><textarea value={location.summary||''}onChange={e=>setLocation({...location,summary:e.target.value})}/><label>Blog/reflection</label><textarea ref={blogRef}value={location.blog||''}onChange={e=>setLocation({...location,blog:e.target.value})}/><p className="hint">Use media tokens like [[media:MEDIA_ID]] to embed photos or videos in the blog. Copy the token from the media row and paste it into the blog text.</p><label>Upload photos or videos from phone</label><input type="file"multiple accept="image/*,video/*"onChange={e=>selectFiles(e.target.files)}/>{fileItems.map((item,i)=><div className="selected-file"key={item.file.name+i}><b>{item.file.name}</b><input placeholder="Caption for this item"value={item.caption}onChange={e=>{const next=[...fileItems];next[i]={...next[i],caption:e.target.value};setFileItems(next)}}/></div>)}<button className={busy==='location'?'busy':''}onClick={saveLocation}>{busy==='location'?'Uploading media...':location.id?'Update location':'Publish location'}</button>{location.id&&<button className="danger"onClick={removeLocation}>{busy==='delete'?'Deleting...':'Delete location'}</button>}<div className="media-admin"ref={mediaRef}><h3>Media for this location</h3>{location.id&&!locMedia.length&&<p className="hint">Upload photos or videos, then update the location. New media will appear here immediately.</p>}{locMedia.map(m=><MediaRow key={m.id}m={m}copyToken={copyToken}setHero={setHero}saveCaption={saveCaption}removeMedia={removeMedia}/>)}</div></div></div>}<div className={`toast ${msg?'show':''}`}>{msg}</div></section></main><Footer/></>}
function MediaRow({m,copyToken,setHero,saveCaption,removeMedia}){const[caption,setCaption]=useState(m.caption||'');const isVideo=m.media_type==='video'||/\.(mp4|mov|webm)(\?|$)/i.test(m.url);return <div className="media-row">{isVideo?<video src={m.url}muted playsInline/>:<img src={m.url}/>}<div><small>[[media:{m.id}]]</small><input value={caption}onChange={e=>setCaption(e.target.value)}placeholder="Caption"/></div><button onClick={()=>copyToken(m.id)}>Copy token</button><button onClick={()=>saveCaption(m,caption)}>Save caption</button>{!isVideo&&<button onClick={()=>setHero(m.url)}>Set hero</button>}<button className="danger"onClick={()=>removeMedia(m)}>Delete</button></div>}

function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function subscribe() {
    if (!email.trim()) {
      setMessage('Please enter an email address.');
      return;
    }

    if (!email.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    try {
      setBusy(true);

      const { error } =
        await supabase.functions.invoke(
          'subscribe',
          {
            body: {
              email: email.trim()
            }
          }
        );

      if (error) {
        throw error;
      }

      setEmail('');
      setMessage(
        '✅ Thanks for subscribing! We’ll notify you when a new story is published.'
      );

    } catch (error) {
      setMessage(
        error.message || 'Subscription failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="footer">

      <div className="newsletter-signup">
        <h3>📬 Get Journey Updates</h3>

        <p>
          Be the first to know when Jack & Grace
          publish a new story, photo gallery or
          country update.
        </p>

        <div className="newsletter-form">
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="button"
            onClick={subscribe}
            disabled={busy}
          >
            {busy ? '...' : 'Subscribe'}
          </button>
        </div>

        {message && (
          <small className="newsletter-message">
            {message}
          </small>
        )}
      </div>

      <span>THE 210 PROJECT</span>
      <span>A living travel archive.</span>

       <a href="/admin">Private Admin</a>


    </footer>
  );
}



function Router(){
  const [data] = useData();

  const p = window.location.pathname.split('/').filter(Boolean);

  let page;

 if(p[0] === 'admin'){
  page = <Admin />;
}
else if(p[0] === 'gallery'){
  page = <GalleryIndex />;
}
else if(p[0] === 'archive' && p[1] && p[2] && p[3] === 'gallery'){
  page = <LocationPage countryId={p[1]} slug={p[2]} gallery />;
}
else if(p[0] === 'archive' && p[1] && p[2]){
  page = <LocationPage countryId={p[1]} slug={p[2]} />;
}
else if(p[0] === 'archive' && p[1]){
  page = <CountryPage id={p[1]} />;
}
else{
  page = <Home />;
}

  return (
    <>
      {page}
      {data && <SiteMenu data={data} />}
      {data && <FloatingCompanion data={data} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<Router />);
