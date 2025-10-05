const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const fuzz = require("fuzzball");

let concepts = [];
let chatData = [];
let tmConcepts = []; // holds both TM1 and TM2 rows

// ========== HELPERS ==========
function normalizeText(text) {
  if (!text) return "";
  return text.toString().trim().toLowerCase().replace(/[^\w\s]/gi, ""); 
}

// ========== NAMASTE CSV LOADER ==========
function normalizeRow(row, system) {
  return {
    system,
    code: row.NAMC_CODE || row.NUMC_CODE || row.Code || "",
    term: row.NAMC_TERM || row.NAMC_term || row.NUMC_TERM || row.Term || row.Title || "",
    devnagari: row.NAMC_term_DEVANAGARI || row.NUMC_term_DEVANAGARI || row.Arabic_term || "",
    short_definition: row.Short_definition || row.Description || "",
    long_definition: row.Long_definition || "",
    chapter: row.Chapter || "",
    icd11TM2: row.ICD11_TM2 || "",
    icd11Bio: row.ICD11_Bio || "",
    raw: row,
  };
}

function loadCSV(filePath, system) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`CSV file not found: ${filePath}`);
      return resolve();
    }

    const temp = [];
    fs.createReadStream(filePath).pipe(csv()).on("data", (row) => temp.push(normalizeRow(row, system)))
    .on("end", () => {
        concepts.push(...temp);
        resolve();
      }).on("error", reject);
  });
}

// ========== TM1/TM2 LOADER ==========
function normalizeTM(row) {
  const values = Object.values(row);
  let code = (row.TM2_Code || row.TM1_Code || values[0] || "").trim();
  let url = (row.TM2_LINK || row.TM1_LINK || row.URL || values[0] || "").trim();
  if (code.startsWith("http")) {
    code = "Code Not Available";
  }

  return {
    tm_code: code,
    disorder: (row.Disorder || row.Term || values[1] || "").trim(),
    module: (row.Module || values[2] || "").trim(),
    url,
    normalized_term: normalizeText(row.Disorder || row.Term || values[1] || ""),
  };
}

function loadTMCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ TM CSV file not found: ${filePath}`);
      return resolve();
    }

    const temp = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => temp.push(normalizeTM(row)))
      .on("end", () => {
        tmConcepts = temp;
        // console.log(`✅ Loaded ${tmConcepts.length} TM1+TM2 records`);
        resolve();
      })
      .on("error", reject);
  });
}

// ========== MAIN LOADER ==========
async function loadAllCSVs() {
  await Promise.all([
    loadCSV(path.join(__dirname, "dataset/Ayurveda.csv"), "Ayurveda"),
    loadCSV(path.join(__dirname, "dataset/Siddha.csv"), "Siddha"),
    loadCSV(path.join(__dirname, "dataset/Unani.csv"), "Unani"),
    loadCSV(path.join(__dirname, "dataset/ICD11.csv"), "ICD11"),
    loadTMCSV(path.join(__dirname, "dataset/TM2.csv")),
  ]);
  console.log("All datasets normalized and loaded:", concepts.length, "records");
}

// ========== CHAT + SEARCH ==========
function buildChatData() {
  chatData = concepts
    .map((row) => {
      const defText = `${row.short_definition || ""} ${row.long_definition || ""}`.toLowerCase();

      let words = defText
        .split(/[^a-zA-Z]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 3);

      words = [...new Set(words)];

      return {
        disease: row.term || row.code || "Unknown",
        system: row.system,
        symptoms: words,
      };
    })
    .filter((item) => item.symptoms.length > 0);

  console.log(`✅ Chat dataset built with ${chatData.length} disease entries`);
}

function searchBySymptom(keyword) {
  keyword = keyword.toLowerCase();
  return concepts.filter(row =>
    (row.term && row.term.toLowerCase().includes(keyword)) ||
    (row.short_definition && row.short_definition.toLowerCase().includes(keyword)) ||
    (row.long_definition && row.long_definition.toLowerCase().includes(keyword))
  );
}

// ========== SYNONYMS & HUMOUR STRIPPER ==========
const tmSynonyms = {
  "acute meningitis": [
    "brain system disorders",
    "other specified brain system disorders",
    "head brain nerve and movement disorders"
  ],
  "sarsam damawi": ["qaranitus", "sarsam", "acute meningitis"]
};

// simple synonyms map
const synonyms = {
  hepatic: "liver",
  hepat: "liver",
  renal: "kidney",
  nephro: "kidney",
  gastric: "stomach",
  gastro: "stomach",
  cardio: "heart",
  cardiac: "heart",
  pulmonary: "lung",
  bronchial: "lung",
  cephalic: "head",
  cranial: "head",
  hepaticity: "liver",
  meningitis: "brain"
};

function applySynonyms(query) {
  if (!query) return query;
  let q = query;
  for (const [key, value] of Object.entries(synonyms)) {
    const regex = new RegExp(`\\b${key}\\w*\\b`, "gi");
    q = q.replace(regex, value);
  }
  return q.trim();
}

function stripHumours(str) {
  if (!str) return str;
  return str
    .replace(/\b(vali|vata|pitta|kapha|balgham|phlegm|humour|humoral|vali-humour)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ========== TM LOOKUP HELPERS ==========
function findTMMatch(query, moduleType) {
  if (!query) return null;
  const normalizedQuery = normalizeText(query);

  const dataset = tmConcepts.filter(row => (row.module || "").toUpperCase() === moduleType.toUpperCase());
  if (dataset.length === 0) return null;

  // 1️⃣ Code match
  let match = dataset.find(row => (row.tm_code || "").toUpperCase() === query.toUpperCase());
  if (match) return match;

  // 2️⃣ Exact disorder match
  match = dataset.find(row => (row.disorder || "").toLowerCase() === query.toLowerCase());
  if (match) return match;

  // 3️⃣ Slash/comma separated variants
  const variants = query.split(/[\/,]/).map(v => normalizeText(v.trim()));
  for (const v of variants) {
    match = dataset.find(row => row.normalized_term === v);
    if (match) return match;
  }

  // 4️⃣ Normalized full query
  match = dataset.find(row => row.normalized_term === normalizedQuery);
  if (match) return match;

  // 5️⃣ Synonym array lookup
  if (tmSynonyms[normalizedQuery]) {
    for (const syn of tmSynonyms[normalizedQuery]) {
      match = dataset.find(row => row.normalized_term === normalizeText(syn));
      if (match) return match;
    }
  }

  // 6️⃣ Fuzzy match
  const best = dataset
    .map(row => ({
      row,
      score: fuzz.partial_ratio(row.normalized_term, normalizedQuery)
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (best && best.score > 60) {
    // console.log(`✅ Fuzzy ${moduleType} match found:`, best.row, "Score:", best.score);
    return best.row;
  }

  // console.log(`❌ No ${moduleType} match found for:`, query);
  return null;
}

function findTM1Match(query) {
  return findTMMatch(query, "TM1");
}

function findTM2Match(query) {
  return findTMMatch(query, "TM2");
}

// ========== EXPORTS ==========
module.exports = {
  loadAllCSVs,
  concepts,
  buildChatData,
  chatData,
  searchBySymptom,
  tmConcepts,
  normalizeText,
  findTM1Match,
  findTM2Match,
  applySynonyms,
  stripHumours,
};
