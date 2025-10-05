// routes/chatbot.js
const express = require("express");
const router = express.Router();
const fuzz = require("fuzzball");

// import from your CSV model
const { searchBySymptom, concepts } = require("../models/cvs.js");

// Session store
let chatSessions = {};

// ✅ Only keep disease-like entries (not anatomy/procedure)
function isDiseaseEntry(row) {
  const term = (row.term || "").toLowerCase();
  if (
    term.includes("artery") || term.includes("muscle") || term.includes("bone") ||
    term.includes("procedure") || term.includes("instrument") ||
    term.includes("device") || term.includes("structure")
  ) {
    return false;
  }
  return !!(row.short_definition || row.long_definition);
}

// Clean message
function cleanMessage(msg) {
  return msg.toLowerCase().replace(/i am facing|i have|i am experiencing|suffering from|i feel|feeling|i am|i'm|my|me|myself/gi, "").replace(/[^\w\s]/gi, "").trim();
}

// Extract symptoms from disease definitions
function extractSymptomsFromDefinition(definition) {
  if (!definition) return [];
  const text = definition.toLowerCase();
  const patterns = [
    /symptoms include (.+?)(\.|;|,|$)/,
    /characterized by (.+?)(\.|;|,|$)/,
    /manifested as (.+?)(\.|;|,|$)/,
  ];

  for (let p of patterns) {
    const match = text.match(p);
    if (match) {
      return match[1]
        .split(/,| and /)
        .map(s => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// Google search fallback
function getGoogleSearchUrl(symptoms) {
  const query = encodeURIComponent(`${symptoms} symptoms medical`);
  return `https://www.google.com/search?q=${query}`;
}

// Fuzzy search helpers
function performFuzzySearch(symptom) {
  const allDiseases = concepts.filter(isDiseaseEntry);
  return allDiseases.filter(disease => {
    const searchText = `${disease.term} ${disease.short_definition} ${disease.long_definition}`.toLowerCase();
    return fuzz.partial_ratio(searchText, symptom) > 75;
  }).slice(0, 15);
}

// Format disease info (full details)
function formatDiseaseInfo(d) {
  return `✅ Based on your symptoms, here’s a possible match:<br><br>` +
    `🩺 <b>Condition:</b> ${d.term}<br>` +
    `📌 <b>System:</b> ${d.system || "N/A"}<br>` +
    `📌 <b>Code:</b> ${d.code || "N/A"}<br>` +
    `📖 <b>Short Definition:</b> ${d.short_definition || "Not available"}<br>` +
    (d.long_definition ? `📚 <b>Detailed Definition:</b> ${d.long_definition}<br>` : "") +
    `<br>🔍 <a href="/map/${d.code}" target="_blank">More info</a><br><br>` +
    `💡 You can type <i>reset</i> to start a new session.`;
}

// ================== CHATBOT ROUTE ==================
router.post("/message", async (req, res) => {
  const { sessionId, message } = req.body;
  const rawMsg = message.toLowerCase().trim();

  // --- Fun cases ---
  if (/what('s| is) your name/i.test(rawMsg) ||
      ["what is your name","who are you","your name"].includes(rawMsg)) {
    return res.json({
      reply: "🤖 I'm <b>AyuLinker Chatbot</b>, built to help you explore possible health conditions.<br>" +
             "💡 Start by describing how you feel, like <i>I have a fever</i> or <i>headache and nausea</i>."
    });
  }

  if (rawMsg === "kya bolte company?") {
    return res.json({
      reply: "🎉🔥 Jackpot! XD <br>💼✨ Bohot kamayenge money 💰💸😎"
    });
  }

  const msg = cleanMessage(rawMsg);

  // Gratitude
  if (["thanks", "thank you", "thank", "thx", "ty"].includes(msg)) {
    return res.json({
      reply: "You're welcome!😊<br><br>" +
             "💡 <b>Next:</b><br>" +
             "• Describe another symptom<br>" +
             "• Type <i>reset</i> to restart<br>" +
             "• Or click a condition above for details"
    });
  }

  // Reset
  if (["reset","start over","restart"].includes(msg)) {
    chatSessions[sessionId] = { found: [], confirmed: [], stage: "initial" };
    return res.json({
      reply: "🔄 Session reset. Tell me your first symptom, e.g. 'fever', 'headache', or 'back pain'."
    });
  }

  // Start session
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = { found: [], confirmed: [], stage: "initial" };
    if (["hi","hello","hey","hola","hii"].includes(msg)) {
      return res.json({
        reply: "👋 Hello! I'm AyuLinker Chatbot.<br><br>Please describe what you're experiencing, like <i>I have fever</i> or <i>I'm feeling nauseous</i>."
      });
    }
  }

  const session = chatSessions[sessionId];

  try {
    // STEP 1: INITIAL SEARCH
    if (session.stage === "initial" || session.found.length === 0) {
      let matches = searchBySymptom(msg).filter(isDiseaseEntry);
      if (matches.length === 0) matches = performFuzzySearch(msg);

      if (matches.length === 0) {
        return res.json({
          reply: `🤔 I couldn't find any conditions related to "${message}".<br><br>` +
                 `💡 Suggestions:<br>` +
                 `• Try different words<br>` +
                 `• Be more specific (e.g., "sharp pain in lower right abdomen")<br>` +
                 `• Or describe another symptom<br><br>` +
                 `🔍 <a href="${getGoogleSearchUrl(message)}" target="_blank">Search Google</a>`
        });
      }

      session.found = matches;
      session.stage = "narrowing";

      const candidate = session.found[0];
      const extracted = extractSymptomsFromDefinition(candidate.long_definition);

      if (extracted.length > 0) {
        session.pendingQuestions = extracted;
        session.lastAskedSymptom = session.pendingQuestions.shift();
        return res.json({
          reply: `🤔 Possible conditions found. To narrow down:<br><br>` +
                 `Do you also experience <b>${session.lastAskedSymptom}</b>? (yes / no)`
        });
      }

      // ✅ fallback ONLY if no extractable symptoms
      return res.json({
        reply: `📋 I found ${session.found.length} possible conditions for "${message}".<br><br>` +
               session.found.slice(0,5).map(d =>
                 `• <a href="/map/${d.code}" target="_blank">${d.term}</a>`
               ).join("<br>") +
               `<br><br>💡 Try adding another symptom for more accurate narrowing.`
      });
    }

    // STEP 2: YES/NO QUESTIONS + free-text
    if (session.stage === "narrowing") {
      if (["yes","no"].includes(msg)) {
        const symptom = session.lastAskedSymptom;

        if (msg === "yes") {
          session.confirmed.push(symptom);
          session.found = session.found.filter(d => {
            const defs = `${d.term} ${d.short_definition || ""} ${d.long_definition || ""}`.toLowerCase();
            return defs.includes(symptom);
          });
        } else {
          session.found = session.found.filter(d => {
            const defs = `${d.term} ${d.short_definition || ""} ${d.long_definition || ""}`.toLowerCase();
            return !defs.includes(symptom);
          });
        }

        if (session.found.length === 1) {
          session.stage = "completed";
          return res.json({ reply: formatDiseaseInfo(session.found[0]) });
        }

        if (session.pendingQuestions && session.pendingQuestions.length > 0) {
          session.lastAskedSymptom = session.pendingQuestions.shift();
          return res.json({
            reply: `Do you also experience <b>${session.lastAskedSymptom}</b>? (yes / no)`
          });
        }

        if (session.found.length > 1) {
          return res.json({
            reply: `📋 Based on your answers, I still see ${session.found.length} possible conditions:<br><br>` +
                   session.found.slice(0,8).map(d =>
                     `• <a href="/map/${d.code}" target="_blank">${d.term}</a>`
                   ).join("<br>") +
                   `<br><br>💡 You can describe another symptom to help narrow further.`
          });
        }

        if (session.found.length === 0) {
          return res.json({
            reply: `❌ No conditions matched your answers.<br><br>` +
                   `🔍 <a href="${getGoogleSearchUrl(message)}" target="_blank">Search Google for "${message}"</a>`
          });
        }
      } else {
        // free-text new symptom(s)
        const newSymptoms = msg.split(/,| and |&/).map(s => s.trim()).filter(Boolean);
        session.confirmed.push(...newSymptoms);

        session.found = session.found.filter(d => {
          const defs = `${d.term} ${d.short_definition || ""} ${d.long_definition || ""}`.toLowerCase();
          return newSymptoms.every(sym => defs.includes(sym));
        });

        if (session.found.length === 1) {
          session.stage = "completed";
          return res.json({ reply: formatDiseaseInfo(session.found[0]) });
        }

        if (session.found.length === 0) {
          return res.json({
            reply: `❌ No conditions matched "${newSymptoms.join(", ")}".<br><br>` +
                   `💡 Try describing symptoms one by one, or type <i>reset</i> to start over.`
          });
        }

        return res.json({
          reply: `👍 Added "${newSymptoms.join(", ")}". Now ${session.found.length} conditions match.<br><br>` +
                 `You can keep describing or type <i>reset</i> to start over.`
        });
      }
    }

    // STEP 3: COMPLETED
    if (session.stage === "completed") {
      return res.json({
        reply: `💡 Session complete. Type <i>reset</i> to start again, or describe more symptoms.`
      });
    }

  } catch (error) {
    console.error("Chatbot error:", error);
    return res.json({
      reply: "⚠️ Sorry, I encountered an error. Please try again or type <i>reset</i>."
    });
  }
});

module.exports = router;