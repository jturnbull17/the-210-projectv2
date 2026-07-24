const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

function jsonResponse(payload, status) {
  return new Response(
    JSON.stringify(payload),
    {
      status: status || 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

function textValue(value) {
  return String(value || "").trim();
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function compact(value, maxLength) {
  const text = textValue(value);

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + "...";
}

function normaliseHighlights(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(function(item) {
      return textValue(item).length > 0;
    });
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(function(item) {
          return textValue(item).length > 0;
        });
      }
    } catch (_error) {
      return [value].filter(function(item) {
        return textValue(item).length > 0;
      });
    }
  }

  return [];
}

async function supabaseGet(supabaseUrl, supabaseKey, path) {
  const response = await fetch(
    supabaseUrl + path,
    {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": "Bearer " + supabaseKey,
        "Content-Type": "application/json"
      }
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Supabase request failed");
  }

  return responseText ? JSON.parse(responseText) : [];
}

function buildCountryContext(countries) {
  return countries
    .map(function(country) {
      return [
        "Country: " + textValue(country.name),
        "Phase: " + textValue(country.phase),
        "Dates: " + textValue(country.dates),
        "Status: " + textValue(country.status),
        "Current location: " + textValue(country.current_location),
        "Highlights: " + normaliseHighlights(country.highlights).join(", "),
        "Summary: " + compact(country.summary, 700)
      ].join("\n");
    })
    .join("\n\n");
}

function buildLocationContext(locations, countries, includeBlog) {
  return locations
    .map(function(location) {
      const country = countries.find(function(item) {
        return item.id === location.country_id;
      });

      const parts = [
        "Country: " + (country ? country.name : location.country_id),
        "Location: " + textValue(location.name),
        "Date: " + textValue(location.date_text),
        "Live location: " + (location.is_live ? "yes" : "no"),
        "Highlights: " + normaliseHighlights(location.highlights).join(", "),
        "Tags: " + normaliseHighlights(location.tags).join(", "),
        "Summary: " + compact(location.summary, 700)
      ];

      if (includeBlog) {
        parts.push("Blog: " + compact(location.blog, 1000));
      }

      return parts.join("\n");
    })
    .join("\n\n");
}

function questionMentionsCountry(questionLower, country) {
  return (
    questionLower.includes(lower(country.name)) ||
    questionLower.includes(lower(country.id))
  );
}

function questionMentionsLocation(questionLower, location) {
  return (
    questionLower.includes(lower(location.name)) ||
    questionLower.includes(lower(location.slug)) ||
    questionLower.includes(lower(location.country_id))
  );
}

function wantsHighlights(questionLower) {
  return (
    questionLower.includes("highlight") ||
    questionLower.includes("highlights") ||
    questionLower.includes("best bits") ||
    questionLower.includes("best moments")
  );
}

function wantsSummary(questionLower) {
  return (
    questionLower.includes("summary") ||
    questionLower.includes("summarise") ||
    questionLower.includes("summarize") ||
    questionLower.includes("what is") ||
    questionLower.includes("what was")
  );
}

Deno.serve(async function(req) {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (req.method === "GET") {
    return jsonResponse({
      answer: "AI Companion is ready"
    });
  }

  try {
    const body = await req.json().catch(function() {
      return {};
    });

    const question = textValue(body.question);
    const questionLower = lower(question);

    if (!question) {
      return jsonResponse(
        {
          answer: "Ask me a question about the journey first."
        },
        400
      );
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const countries = await supabaseGet(
      supabaseUrl,
      supabaseKey,
      "/rest/v1/countries?select=id,name,phase,route_order,dates,summary,current_location,status,highlights&is_published=eq.true&order=route_order.asc"
    );

    const locations = await supabaseGet(
      supabaseUrl,
      supabaseKey,
      "/rest/v1/locations?select=country_id,slug,name,date_text,summary,blog,highlights,tags,sort_order,is_live&is_published=eq.true&order=sort_order.asc"
    );

    const liveLocation = locations.find(function(location) {
      return location.is_live === true;
    });

    const liveCountry =
      liveLocation
        ? countries.find(function(country) {
            return country.id === liveLocation.country_id;
          })
        : countries.find(function(country) {
            return country.status === "live";
          });

    const matchingCountries = countries.filter(function(country) {
      return questionMentionsCountry(questionLower, country);
    });

    const matchingLocations = locations.filter(function(location) {
      const country = countries.find(function(item) {
        return item.id === location.country_id;
      });

      return (
        questionMentionsLocation(questionLower, location) ||
        (country && questionMentionsCountry(questionLower, country))
      );
    });

if (wantsHighlights(questionLower) && matchingCountries.length === 1) {
  const matchedCountry = matchingCountries[0];

  const countryLocations = locations.filter(function(location) {
    return location.country_id === matchedCountry.id;
  });

  let highlights = normaliseHighlights(matchedCountry.highlights);

  countryLocations.forEach(function(location) {
    highlights = highlights.concat(
      normaliseHighlights(location.highlights)
    );
  });

  const uniqueHighlights = highlights.filter(function(item, index) {
    return highlights.indexOf(item) === index;
  });

  if (uniqueHighlights.length > 0) {
    return jsonResponse({
      answer:
        "Highlights from " +
        matchedCountry.name +
        ": " +
        uniqueHighlights.join(", ")
    });
  }
}
    /*
      FREE ANSWERS.
      These do not call Gemini, so they cost nothing.
    */

    if (
      questionLower.includes("where are") ||
      questionLower.includes("where is") ||
      questionLower.includes("current location") ||
      questionLower.includes("where are jack and grace") ||
      questionLower.includes("where is jack") ||
      questionLower.includes("where is grace")
    ) {
      if (liveLocation && liveCountry) {
        return jsonResponse({
          answer:
            "Jack and Grace are currently in " +
            liveLocation.name +
            ", " +
            liveCountry.name +
            ". " +
            compact(liveLocation.summary, 240)
        });
      }

      if (liveCountry && liveCountry.current_location) {
        return jsonResponse({
          answer:
            "Jack and Grace are currently in " +
            liveCountry.current_location +
            ", " +
            liveCountry.name +
            "."
        });
      }

      return jsonResponse({
        answer: "Current location is not available yet."
      });
    }

    if (
      questionLower.includes("what countries") ||
      questionLower.includes("which countries") ||
      questionLower.includes("route") ||
      questionLower.includes("where next") ||
      questionLower.includes("countries are planned") ||
      questionLower.includes("countries come after")
    ) {
      const route = countries
        .map(function(country) {
          return country.name;
        })
        .join(" -> ");

      return jsonResponse({
        answer: route || "The route has not been published yet."
      });
    }

    if (wantsHighlights(questionLower) && matchingLocations.length === 1) {
      const matchedLocation = matchingLocations[0];
      const matchedCountry = countries.find(function(country) {
        return country.id === matchedLocation.country_id;
      });

      const locationHighlights = normaliseHighlights(matchedLocation.highlights);

      if (locationHighlights.length > 0) {
        return jsonResponse({
          answer:
            "Highlights from " +
            matchedLocation.name +
            (matchedCountry ? ", " + matchedCountry.name : "") +
            ": " +
            locationHighlights.join(", ")
        });
      }
    }

if (wantsHighlights(questionLower) && matchingCountries.length === 1) {
  const matchedCountry = matchingCountries[0];

  const countryLocations = locations.filter(function(location) {
    return location.country_id === matchedCountry.id;
  });

  let highlights = normaliseHighlights(matchedCountry.highlights);

  countryLocations.forEach(function(location) {
    highlights = highlights.concat(normaliseHighlights(location.highlights));
  });

  const uniqueHighlights = highlights.filter(function(item, index) {
    return highlights.indexOf(item) === index;
  });

  if (uniqueHighlights.length > 0) {
    return jsonResponse({
      answer:
        "Highlights from " +
        matchedCountry.name +
        ": " +
        uniqueHighlights.join(", ")
    });
  }
}

if (
  matchingCountries.length === 1 &&
  (
    questionLower.includes("what did they do") ||
    questionLower.includes("what happened in") ||
    questionLower.includes("what happened")
  )
) {
  const matchedCountry = matchingCountries[0];

  const countryLocations = locations.filter(function(location) {
    return location.country_id === matchedCountry.id;
  });

  const locationNames = countryLocations
    .map(function(location) {
      return location.name;
    })
    .filter(Boolean);

  const summaries = countryLocations
    .map(function(location) {
      return location.name + ": " + textValue(location.summary);
    })
    .filter(Boolean);

  return jsonResponse({
    answer:
      "During their time in " +
      matchedCountry.name +
      ", Jack and Grace visited " +
      locationNames.join(", ") +
      ".\n\n" +
      summaries.slice(0, 5).join("\n\n")
  });
}

    if (matchingLocations.length === 1 && wantsSummary(questionLower)) {
      const matchedLocation = matchingLocations[0];
      const matchedCountry = countries.find(function(country) {
        return country.id === matchedLocation.country_id;
      });

      return jsonResponse({
        answer:
          matchedLocation.name +
          (matchedCountry ? ", " + matchedCountry.name : "") +
          ": " +
          compact(matchedLocation.summary, 350) +
          (matchedLocation.blog
            ? "\n\n" + compact(matchedLocation.blog, 700)
            : "")
      });
    }

    if (
      matchingCountries.length === 1 &&
      matchingLocations.length === 0 &&
      wantsSummary(questionLower)
    ) {
      const matchedCountry = matchingCountries[0];

      return jsonResponse({
        answer:
          matchedCountry.name +
          ": " +
          compact(matchedCountry.summary, 800)
      });
    }

if (
  matchingCountries.length === 1 &&
  (
    questionLower.includes("what locations") ||
    questionLower.includes("which locations") ||
    questionLower.includes("where did they visit") ||
    questionLower.includes("places visited")
  )
) {
  const matchedCountry = matchingCountries[0];

  const countryLocations = locations
    .filter(function(location) {
      return location.country_id === matchedCountry.id;
    })
    .map(function(location) {
      return location.name;
    })
    .filter(Boolean);

  return jsonResponse({
    answer:
      "During their time in " +
      matchedCountry.name +
      ", Jack and Grace visited " +
      countryLocations.join(", ") +
      "."
  });
}

if (
  questionLower.includes("summarise their journey") ||
  questionLower.includes("summarize their journey") ||
  questionLower.includes("journey so far") ||
  questionLower.includes("trip so far")
) {
  const visitedCountries = countries.filter(function(country) {
    return country.status === "visited" || country.status === "live";
  });

  const countryNames = visitedCountries.map(function(country) {
    return country.name;
  });

  const locationNames = locations
    .filter(function(location) {
      return visitedCountries.some(function(country) {
        return country.id === location.country_id;
      });
    })
    .map(function(location) {
      return location.name;
    });

  return jsonResponse({
    answer:
      "So far, Jack and Grace have travelled through " +
      countryNames.join(", ") +
      ". Along the way they have visited locations including " +
      locationNames.slice(0, 12).join(", ") +
      ". Highlights have included Machu Picchu, coastal adventures, local food experiences, historic city exploration and preparing for the next stages of the journey."
  });
}

    /*
      GEMINI ANSWERS.
      Only use Gemini when simple Supabase answers are not enough.
      Send only relevant context to reduce token cost.
    */

    if (!geminiKey) {
      throw new Error("Missing GEMINI_API_KEY secret");
    }

    let contextCountries = matchingCountries;
    let contextLocations = matchingLocations;

    if (contextCountries.length === 0 && contextLocations.length > 0) {
      contextCountries = countries.filter(function(country) {
        return contextLocations.some(function(location) {
          return location.country_id === country.id;
        });
      });
    }

    if (contextCountries.length === 0 && liveCountry) {
      contextCountries = [liveCountry];
    }

    if (matchingCountries.length > 0) {
      contextLocations = locations.filter(function(location) {
        return matchingCountries.some(function(country) {
          return country.id === location.country_id;
        });
      });
    }

    if (contextLocations.length === 0 && liveLocation) {
      contextLocations = [liveLocation];
    }

    if (contextCountries.length === 0) {
      contextCountries = countries.slice(0, 2);
    }

    if (contextLocations.length === 0) {
      contextLocations = locations.slice(0, 2);
    }

    contextCountries = contextCountries.slice(0, 3);
    contextLocations = contextLocations.slice(0, 4);

    const includeBlogContent =
      matchingLocations.length > 0 ||
      matchingCountries.length > 0 ||
      questionLower.includes("detail") ||
      questionLower.includes("story") ||
      questionLower.includes("blog") ||
      questionLower.includes("changed") ||
      questionLower.includes("experience");

    const countryContext = buildCountryContext(contextCountries);
    const locationContext = buildLocationContext(
      contextLocations,
      countries,
      includeBlogContent
    );

    const prompt =
      "You are The 210 Companion, the AI guide for Jack and Grace's travel journal.\n\n" +
      "Only answer using the travel information provided below.\n\n" +
      "When answering:\n" +
"- Use details from the summaries, highlights and blogs.\n" +
"- Mention countries and locations by name.\n" +
"- When asked about a country, summarise the locations visited in that country.\n" +
"- Include notable activities and highlights.\n" +
"- Write in a travel-journal style.\n" +
"- Use no more than 2 short paragraphs.\n" +
"- Give specific details rather than generic summaries.\n\n" +
      "If the answer is not available in the travel information, say exactly:\n" +
      "\"That story has not been published yet.\"\n\n" +
      "Do not use outside knowledge.\n" +
      "Do not answer using novels, TV shows, celebrities, or general internet knowledge.\n" +
      "Jack and Grace refers only to the travellers in The 210 Project.\n\n" +
      "Current country: " +
      (liveCountry ? liveCountry.name : "Unknown") +
      "\n" +
      "Current location: " +
      (liveLocation ? liveLocation.name : liveCountry ? liveCountry.current_location || "Unknown" : "Unknown") +
      "\n\n" +
      "Travel information:\n\n" +
      countryContext +
      "\n\n" +
      locationContext +
      "\n\nQuestion:\n" +
      question;

    const apiBase = "https:" + "//generativelanguage.googleapis.com";
    const modelPath = "/v1beta/models/gemini-3.5-flash:generateContent";
    const geminiUrl = apiBase + modelPath + "?key=" + geminiKey;

    const response = await fetch(
      geminiUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 180
          }
        })
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        json && json.error && json.error.message
          ? json.error.message
          : "Gemini request failed"
      );
    }

    const answer =
      json &&
      json.candidates &&
      json.candidates[0] &&
      json.candidates[0].content &&
      json.candidates[0].content.parts &&
      json.candidates[0].content.parts[0] &&
      json.candidates[0].content.parts[0].text
        ? json.candidates[0].content.parts[0].text
        : "No Gemini response";

    return jsonResponse({
      answer: answer
    });
  } catch (error) {
    return jsonResponse(
      {
        answer: "The AI companion is not available yet.",
        error: String(error && error.message ? error.message : error)
      },
      500
    );
  }
});
