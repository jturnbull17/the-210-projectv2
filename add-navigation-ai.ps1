$mainPath = ".\src\main.jsx"
$cssPath = ".\src\styles.css"

if (!(Test-Path $mainPath)) {
  Write-Host "Could not find src\main.jsx. Run this from the project root."
  exit 1
}

if (!(Test-Path $cssPath)) {
  Write-Host "Could not find src\styles.css. Run this from the project root."
  exit 1
}

Copy-Item $mainPath "$mainPath.bak" -Force
Copy-Item $cssPath "$cssPath.bak" -Force

$main = Get-Content $mainPath -Raw

$components = @'
function SiteMenu(){
  const [data]=useData();
  const [open,setOpen]=useState(false);

  if(!data)return null;

  const latest=getLatestStory(data);
  const countries=[...(data.countries||[])].sort((a,b)=>(a.route_order||99)-(b.route_order||99));

  function openCompanion(){
    setOpen(false);
    window.dispatchEvent(new Event('open-210-companion'));
  }

  return <>
    <button className="hamburger-button" type="button" onClick={()=>setOpen(true)} aria-label="Open menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    {open&&<div className="menu-overlay" onClick={()=>setOpen(false)}>
      <aside className="site-menu" onClick={e=>e.stopPropagation()}>
        <div className="site-menu-head">
          <p>THE 210 PROJECT</p>
          <button type="button" onClick={()=>setOpen(false)}>Close</button>
        </div>

        <nav className="site-menu-links">
          /setOpen(false)}>Home</a>
          /#journey-mapsetOpen(false)}>Journey Map</a>

          {latest?.country&&latest?.loc&&
            {`/archive/${latest.country.id}/${latest.loc.slug}`}setOpen(false)}>Latest Story</a>
          }

          <div className="menu-country-group">
            <b>Countries</b>
            {countries.map(country=>{
              const countryLocations=(data.locations||[]).filter(location=>location.country_id===country.id);
              const hasStories=countryLocations.length>0;
              const isAvailable=hasStories&&(country.status==='visited'||country.status==='live'||country.id===data.settings.current_country_id);

              return isAvailable
                ? {`/archive/${country.id}`}setOpen(false)}>
                    {String(country.route_order||'').padStart(2,'0')} / {country.name}
                  </a>
                : <span key={country.id} className="menu-disabled">
                    {String(country.route_order||'').padStart(2,'0')} / {country.name} - Coming soon
                  </span>
            })}
          </div>

          <button type="button" className="menu-ai-link" onClick={openCompanion}>
            AI Companion
          </button>

          /gallerysetOpen(false)}>Gallery</a>
        </nav>
      </aside>
    </div>}
  </>;
}

function FloatingCompanion(){
  const [data]=useData();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('Where are Jack and Grace now?');
  const [answer,setAnswer]=useState('Ask anything about places, stories, highlights and the journey so far.');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [loadingMessage,setLoadingMessage]=useState('Checking the journal...');

  useEffect(()=>{
    function openHandler(){setOpen(true)}
    window.addEventListener('open-210-companion',openHandler);
    return()=>window.removeEventListener('open-210-companion',openHandler);
  },[]);

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

    setBusy(true);
    setError('');
    setLoadingMessage(loadingMessages[Math.floor(Math.random()*loadingMessages.length)]);

    try{
      const {data:res,error}=await supabase.functions.invoke('ask-companion',{body:{question}});
      if(error)throw error;
      setAnswer(res?.answer||'I could not find a published story for that yet.');
    }catch(e){
      setError(e.message||'The AI companion could not answer just now.');
    }finally{
      setBusy(false);
    }
  }

  return <>
    <button className="floating-ai-button" type="button" onClick={()=>setOpen(true)}>
      AI
    </button>

    {open&&<div className="floating-ai-overlay">
      <div className="floating-ai-backdrop" onClick={()=>setOpen(false)}></div>

      <section className="floating-ai-panel">
        <div className="floating-ai-head">
          <div>
            <p>THE 210 COMPANION</p>
            <h2>Ask about the journey.</h2>
          </div>
          <button type="button" onClick={()=>setOpen(false)}>Close</button>
        </div>

        <article className="floating-ai-answer">
          <p>RESPONSE</p>
          <h3>{busy?loadingMessage:answer}</h3>
          {error&&<small className="ai-error">{error}</small>}
        </article>

        <div className="floating-suggested-questions">
          <p>Try asking</p>
          {suggestedQuestions.map(function(item){
            return <button type="button" key={item} onClick={()=>{setQuery(item);askCompanion(item)}}>{item}</button>
          })}
        </div>

        <div className="floating-ask-bar">
          <Search size={15}/>
          <input
            value={query}
            placeholder="Ask about a place, story or highlight..."
            onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')askCompanion()}}
          />
          <button type="button" onClick={()=>askCompanion()} disabled={busy}>
            {busy?'...':'>'}
          </button>
        </div>
      </section>
    </div>}
  </>;
}

function AllGalleryPage(){
  const [data]=useData();

  if(!data)return <Loading/>;

  const countries=[...(data.countries||[])].sort((a,b)=>(a.route_order||99)-(b.route_order||99));

  return <>
    <main className="hero-surface country-hero">
      <section className="country-hero-inner">
        <Crumbs items={[{label:'Gallery'}]}/>
        <p className="kicker"><i/> MEDIA GALLERY</p>
        <h1>Gallery</h1>
        <p className="lead">Photos and videos from the journey, grouped by country and location.</p>
      </section>
    </main>

    <section className="story-section">
      <div className="section-inner all-gallery-page">
        {countries.map(country=>{
          const countryLocations=(data.locations||[]).filter(location=>location.country_id===country.id);
          const countryMedia=(data.media||[]).filter(media=>{
            return countryLocations.some(location=>location.id===media.location_id);
          });

          if(!countryMedia.length)return null;

          return <section className="gallery-country-block" key={country.id}>
            <p className="kicker dark"><i/> {country.name}</p>
            <h2>{country.name}</h2>

            {countryLocations.map(location=>{
              const locationMedia=(data.media||[]).filter(media=>media.location_id===location.id);

              if(!locationMedia.length)return null;

              return <div className="gallery-location-block" key={location.id}>
                <h3>{location.name}</h3>
                <div className="all-gallery-grid">
                  {locationMedia.map(media=>{
                    const isVideo=media.media_type==='video'||/\.(mp4|webm|mov)(\?|$)/i.test(media.url);

                    return <figure key={media.id}>
                      {isVideo
                        ? {media.url}
                        : {media.url}
                      }
                      {media.caption&&<figcaption>{media.caption}</figcaption>}
                    </figure>
                  })}
                </div>
              </div>
            })}
          </section>
        })}
      </div>
    </section>

    <Footer/>
  </>;
}

function Chrome({children}){
  return <>
    <SiteMenu/>
    <FloatingCompanion/>
    {children}
  </>;
}
'@

if($main -notmatch "function SiteMenu\("){
  $main = $main.Replace("function Router(){", $components + "`r`nfunction Router(){")
}

$routerPattern = "function Router\(\)\{const p=window\.location\.pathname\.split\('/'\)\.filter\(Boolean\);.*?return <Home\/>\}"
$routerReplacement = "function Router(){const p=window.location.pathname.split('/').filter(Boolean);if(p[0]==='admin')return <Admin/>;if(p[0]==='gallery')return <Chrome><AllGalleryPage/></Chrome>;if(p[0]==='archive'&&p[1]&&p[2]&&p[3]==='gallery')return <Chrome><LocationPage countryId={p[1]} slug={p[2]} gallery/></Chrome>;if(p[0]==='archive'&&p[1]&&p[2])return <Chrome><LocationPage countryId={p[1]} slug={p[2]}/></Chrome>;if(p[0]==='archive'&&p[1])return <Chrome><CountryPage id={p[1]}/></Chrome>;return <Chrome><Home/></Chrome>}"

$main = :Replace($main,$routerPattern,$routerReplacement,[System.Text.RegularExpressions.RegexOptions]::Singleline)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $mainPath), $main, $utf8NoBom)

$css = Get-Content $cssPath -Raw

if($css -notmatch "floating-ai-button"){
$css = $css + @'

/* Global navigation and floating AI companion */
.bottom-nav {
  display: none !important;
}

.hamburger-button {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 80;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: 1px solid rgba(243,236,221,.24);
  background: rgba(9,42,35,.82);
  backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
  gap: 4px;
  cursor: pointer;
}

.hamburger-button span {
  width: 18px;
  height: 2px;
  background: var(--cream);
  display: block;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(4px);
}

.site-menu {
  position: absolute;
  top: 0;
  right: 0;
  width: min(420px, 90vw);
  height: 100%;
  background: #092a23;
  color: var(--cream);
  padding: 28px;
  overflow-y: auto;
  box-shadow: -20px 0 60px rgba(0,0,0,.28);
}

.site-menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.site-menu-head p {
  font-size: 11px;
  letter-spacing: .16em;
  font-weight: 900;
  margin: 0;
}

.site-menu-head button,
.menu-ai-link {
  background: transparent;
  color: var(--cream);
  border: 1px solid rgba(243,236,221,.24);
  padding: 10px 12px;
  font-weight: 900;
  cursor: pointer;
}

.site-menu-links {
  display: grid;
  gap: 12px;
}

.site-menu-links a,
.menu-country-group a,
.menu-disabled,
.menu-ai-link {
  display: block;
  padding: 14px 0;
  border-bottom: 1px solid rgba(243,236,221,.12);
  font-size: 14px;
}

.menu-country-group {
  margin: 12px 0;
}

.menu-country-group b {
  display: block;
  margin-bottom: 8px;
  font-size: 10px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(243,236,221,.65);
}

.menu-disabled {
  opacity: .42;
  cursor: not-allowed;
}

.floating-ai-button {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 75;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.28);
  background: var(--copper);
  color: #fff;
  font-weight: 900;
  letter-spacing: .04em;
  cursor: pointer;
  box-shadow: 0 16px 40px rgba(0,0,0,.24);
}

.floating-ai-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.floating-ai-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(5,29,24,.62);
  backdrop-filter: blur(5px);
}

.floating-ai-panel {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: #092a23;
  color: var(--cream);
  border: 1px solid rgba(243,236,221,.24);
  padding: 22px;
  box-shadow: 0 24px 80px rgba(0,0,0,.38);
}

.floating-ai-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.floating-ai-head p {
  margin: 0 0 8px;
  font-size: 10px;
  letter-spacing: .16em;
  font-weight: 900;
}

.floating-ai-head h2 {
  font-family: 'Cormorant Garamond';
  font-size: 36px;
  line-height: .95;
  margin: 0;
}

.floating-ai-head button {
  background: transparent;
  color: var(--cream);
  border: 1px solid rgba(243,236,221,.24);
  padding: 9px 12px;
  cursor: pointer;
}

.floating-ai-answer {
  background: var(--cream2);
  color: var(--ink);
  padding: 26px;
  margin-top: 20px;
}

.floating-ai-answer p {
  margin: 0 0 8px;
  font-size: 10px;
  letter-spacing: .14em;
  font-weight: 900;
}

.floating-ai-answer h3 {
  font-family: 'Cormorant Garamond';
  font-size: 25px;
  line-height: 1.25;
  margin: 0;
}

.floating-suggested-questions {
  margin: 18px 0;
  display: grid;
  gap: 8px;
}

.floating-suggested-questions p {
  margin: 0 0 4px;
  font-size: 10px;
  letter-spacing: .16em;
  font-weight: 900;
  text-transform: uppercase;
  color: rgba(243,236,221,.7);
}

.floating-suggested-questions button {
  width: 100%;
  text-align: left;
  background: rgba(243,236,221,.07);
  border: 1px solid rgba(243,236,221,.17);
  color: var(--cream);
  padding: 12px 14px;
  border-radius: 16px;
  cursor: pointer;
}

.floating-ask-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--cream);
  padding: 8px;
  border-radius: 18px;
}

.floating-ask-bar svg {
  color: rgba(17,37,31,.55);
  margin-left: 8px;
}

.floating-ask-bar input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: none;
  font-size: 16px;
  color: var(--ink);
}

.floating-ask-bar button {
  width: 46px;
  min-width: 46px;
  height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.25);
  background: var(--copper);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  cursor: pointer;
}

.all-gallery-page {
  display: grid;
  gap: 54px;
}

.gallery-country-block h2 {
  font-family: 'Cormorant Garamond';
  font-size: 54px;
  margin: 8px 0 28px;
}

.gallery-location-block {
  margin-bottom: 36px;
}

.gallery-location-block h3 {
  font-family: 'Cormorant Garamond';
  font-size: 32px;
}

.all-gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.all-gallery-grid img,
.all-gallery-grid video {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.all-gallery-grid figcaption {
  margin-top: 8px;
  font-size: 12px;
  color: #58675f;
}

@media(max-width:980px){
  .hamburger-button {
    top: 16px;
    right: 16px;
  }

  .floating-ai-button {
    right: 16px;
    bottom: 18px;
  }

  .floating-ai-panel {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
  }

  .all-gallery-grid {
    grid-template-columns: 1fr;
  }
}
'@
}

[System.IO.File]::WriteAllText((Resolve-Path $cssPath), $css, $utf8NoBom)

Write-Host "Navigation, floating AI companion and gallery page added."
Write-Host "Backups created:"
Write-Host "$mainPath.bak"
Write-Host "$cssPath.bak"