$mainPath = ".\src\main.jsx"
$cssPath = ".\src\styles.css"

if (!(Test-Path $mainPath)) {
  Write-Host "Could not find src\main.jsx. Run this from the project root."
  exit 1
}

$main = Get-Content $mainPath -Raw

# ------------------------------------------------------------
# Fix visible encoding issues
# ------------------------------------------------------------

$main = $main -replace "â\S{0,4}", ""

$main = $main.Replace([string][char]0x2197, "->")
$main = $main.Replace([string][char]0x2713, "Completed")

# ------------------------------------------------------------
# Companion naming and copy
# ------------------------------------------------------------

$main = $main.Replace("THE ARCHIVE COMPANION", "THE 210 COMPANION")
$main = $main.Replace("AI COMPANION", "THE 210 COMPANION")
$main = $main.Replace("PROTOTYPE", "ASK ABOUT THE JOURNEY")

$main = $main.Replace("THE 210 COMPANIONASK ABOUT THE JOURNEY", "THE 210 COMPANION")
$main = $main.Replace("THE 210 COMPANION ASK ABOUT THE JOURNEY", "THE 210 COMPANION")

$main = $main.Replace(
  "Ask questions about places, stories, lessons and moments from the archive.",
  "Explore the places, stories, highlights and memories that make up The 210 Project."
)

$main = $main.Replace(
  "Ask anything about places, stories, highlights and the journey so far.",
  "Explore the places, stories, highlights and memories that make up The 210 Project."
)

# ------------------------------------------------------------
# Add current country/location helpers if missing
# ------------------------------------------------------------

if ($main.Contains("const suggestedQuestions=") -and !$main.Contains("const currentCountryName=")) {
  $main = $main.Replace(
    "const live=data.settings.current_country_id;",
    "const live=data.settings.current_country_id;const currentCountry=getCountry(data.countries,live)||selected;const liveLocation=(data.locations||[]).find(function(location){return location.is_live===true});const currentCountryName=currentCountry?.name||'the current country';const currentLocationName=liveLocation?.name||currentCountry?.current_location||'the latest stop';"
  )
}

# ------------------------------------------------------------
# Replace suggested questions with dynamic questions
# ------------------------------------------------------------

$replacementQuestions = "const suggestedQuestions=['Where are Jack and Grace now?','What were the highlights in '+currentCountryName+'?','Tell me about '+currentLocationName,'What changed in '+currentCountryName+'?','What countries come next?'];"

$main = :Replace(
  $main,
  "const suggestedQuestions=\[[^\]]*\];",
  $replacementQuestions
)

# Fallback replacements if Lima was hardcoded elsewhere
$main = $main.Replace("'Tell me about Lima'", "'Tell me about '+currentLocationName")
$main = $main.Replace('"Tell me about Lima"', '"Tell me about "+currentLocationName')

# ------------------------------------------------------------
# Loading text
# ------------------------------------------------------------

$main = $main.Replace("Thinking...", "Checking the journal...")

# ------------------------------------------------------------
# Save main.jsx as UTF-8
# ------------------------------------------------------------

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $mainPath), $main, $utf8NoBom)

# ------------------------------------------------------------
# Suggested question styling
# ------------------------------------------------------------

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

Write-Host "Safe companion UX patch applied."