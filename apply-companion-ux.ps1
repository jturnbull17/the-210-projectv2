$mainPath = ".\src\main.jsx"
$cssPath = ".\src\styles.css"

if (!(Test-Path $mainPath)) {
  Write-Host "Could not find src\main.jsx. Run this from the project root."
  exit 1
}

$main = Get-Content $mainPath -Raw

# Remove visible mojibake/broken encoding starting with the common bad character.
# This removes things like broken arrows/ticks without adding special characters back in.
$badPrefix = [string][char]0x00E2
$badRegex = :Escape($badPrefix) + ".{0,3}"
$main = :Replace($main, $badRegex, "")

# Rename companion labels.
$main = $main.Replace("THE ARCHIVE COMPANION", "THE 210 COMPANION")
$main = $main.Replace("AI COMPANION", "THE 210 COMPANION")
$main = $main.Replace("PROTOTYPE", "ASK ABOUT THE JOURNEY")

# Clean up if labels became jammed together.
$main = $main.Replace("THE 210 COMPANIONASK ABOUT THE JOURNEY", "THE 210 COMPANION")
$main = $main.Replace("THE 210 COMPANION ASK ABOUT THE JOURNEY", "THE 210 COMPANION")

# Improve visible copy.
$main = $main.Replace(
  "Ask questions about places, stories, lessons and moments from the archive.",
  "Explore the places, stories, highlights and memories that make up The 210 Project."
)

$main = $main.Replace(
  "Ask anything about places, stories, highlights and the journey so far.",
  "Explore the places, stories, highlights and memories that make up The 210 Project."
)

# Make askCompanion accept a suggested question.
$main = $main.Replace(
  "async function askCompanion(){const question=query.trim();",
  "async function askCompanion(overrideQuestion){const question=String(overrideQuestion||query).trim();"
)

# Add loading state if missing.
$main = $main.Replace(
  "const[aiBusy,setAiBusy]=useState(false);const[aiError,setAiError]=useState('');",
  "const[aiBusy,setAiBusy]=useState(false);const[aiError,setAiError]=useState('');const[loadingMessage,setLoadingMessage]=useState('Checking the journal...');"
)

# Set a rotating loading message when asking.
$main = $main.Replace(
  "setAiBusy(true);setAiError('');",
  "setAiBusy(true);setLoadingMessage(loadingMessages[Math.floor(Math.random()*loadingMessages.length)]);setAiError('');"
)

# Replace Thinking with the loading message state.
$main = $main.Replace(
  "{aiBusy?'Thinking...':aiAnswer}",
  "{aiBusy?loadingMessage:aiAnswer}"
)

# Add dynamic helper variables and suggested questions.
if (!$main.Contains("const suggestedQuestions=")) {
  $main = $main.Replace(
    "const live=data.settings.current_country_id;",
    "const live=data.settings.current_country_id;const currentCountry=getCountry(data.countries,live)||selected;const liveLocation=(data.locations||[]).find(function(location){return location.is_live===true});const currentCountryName=currentCountry?.name||'the current country';const currentLocationName=liveLocation?.name||currentCountry?.current_location||'the latest stop';const suggestedQuestions=['Where are Jack and Grace now?','What were the highlights in '+currentCountryName+'?','Tell me about '+currentLocationName,'What changed in '+currentCountryName+'?','What countries come next?'];const loadingMessages=['Checking the journal...','Looking through travel notes...','Exploring the route...','Reviewing published stories...','Searching location highlights...'];"
  )
} else {
  $main = :Replace(
    $main,
    "const suggestedQuestions=\[[^\]]*\];",
    "const suggestedQuestions=['Where are Jack and Grace now?','What were the highlights in '+currentCountryName+'?','Tell me about '+currentLocationName,'What changed in '+currentCountryName+'?','What countries come next?'];"
  )
}

# Remove hardcoded Lima suggestions if present.
$main = $main.Replace("'Tell me about Lima'", "'Tell me about '+currentLocationName")
$main = $main.Replace('"Tell me about Lima"', '"Tell me about "+currentLocationName')
$main = $main.Replace("Tell me about Lima", "Tell me about the latest stop")

# Add suggested question chips before the ask bar, if they are not already there.
if (!$main.Contains("suggested-questions")) {
  $main = $main.Replace(
    "</article><div className=""ask-bar"">",
    "</article><div className=""suggested-questions""><p>Try asking</p>{suggestedQuestions.map(function(item){return <button type=""button"" key={item} onClick={function(){setQuery(item);askCompanion(item)}}>{item}</button>})}</div><div className=""ask-bar"">"
  )
}

# Improve input placeholder.
$main = $main.Replace(
  "<input value={query}",
  "<input placeholder=""Ask about a place, story or highlight..."" value={query}"
)

# Improve send button text if present.
$main = $main.Replace(
  "{aiBusy?'...':'↗'}",
  "{aiBusy?'Searching...':'Explore'}"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $mainPath), $main, $utf8NoBom)

# Add CSS if missing.
if (Test-Path $cssPath) {
  $css = Get-Content $cssPath -Raw

  if (!$css.Contains(".suggested-questions")) {
    $css = $css + @'

/* The 210 Companion suggested questions */
.suggested-questions {
  margin: 18px 0 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggested-questions p {
  width: 100%;
  margin: 0 0 2px;
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
  opacity: .7;
  font-weight: 900;
}

.suggested-questions button {
  border: 1px solid rgba(243,236,221,.22);
  background: rgba(243,236,221,.08);
  color: inherit;
  padding: 9px 12px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
  transition: transform .18s ease, background .18s ease, border-color .18s ease;
}

.suggested-questions button:hover {
  transform: translateY(-1px);
  background: rgba(243,236,221,.14);
  border-color: rgba(243,236,221,.38);
}

.ask-bar input::placeholder {
  color: rgba(17,37,31,.55);
}

.ask-bar button {
  min-width: 78px;
}
'@
  }

  [System.IO.File]::WriteAllText((Resolve-Path $cssPath), $css, $utf8NoBom)
}

Write-Host "The 210 Companion UX changes applied."