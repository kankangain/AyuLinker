const express = require("express");
const path = require("path");
const app = express();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const session = require("express-session");
const chatbotRoutes = require("./models/chatRoutes.js");
require("dotenv").config();

const port = 25579;

//MiddleWares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/models", express.static(path.join(__dirname, "models")));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

//for sending messages to chatbot
app.use("/chat", chatbotRoutes);

//Session KEYS
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: null,
    },
  }),
);

function ensureLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}
app.use((req, res, next) => {
  res.locals.loggedIn = !!req.session.user;
  res.locals.user = req.session.user || null;
  next();
});

//===========Csv Loaders===========
const {
  loadAllCSVs,
  concepts,
  findTM1Match,
  findTM2Match,
  applySynonyms,
  stripHumours,
} = require("./models/cvs");
loadAllCSVs();

//========DB=============
const connection = require("./models/db.js");

//=========OTP Requires=========
const generateOTP = require("./models/randomOTP.js");
const sendOTP = require("./models/mailer.js");
let otpStore = {};

//=================send mail================
const {
  generateUsername,
  generateRandomPassword,
  sendCredentials,
} = require("./models/credentials");

//Helper Functions
const { getToken } = require("./models/getToken.js");
const trySearch = require("./models/trySearch.js");

function cleanQuery(text) {
  return text
    .replace(/classified under/gi, "")
    .replace(/vali humour/gi, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
}

//FORMATTED TEXT
function formatDefinition(definition) {
  if (!definition) return null;
  const parts = definition.split(/(?=<em>)/);
  if (parts.length === 1) {
    return { isList: false, content: definition };
  }
  const listItems = parts.map((p) => `<li>${p.trim()}</li>`).join("");
  return {
    isList: true,
    content: `<ul class="definition-list">${listItems}</ul>`,
  };
}

//=========================ROUTES=========================
app.get("/", (req, res) => {
  res.render("index.ejs");
});

//About page
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

//===============Login Routes==============
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/user/login", (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ error: "Username/Email and password are required" });
  }

  const sql = `SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1`;

  connection.query(sql, [identifier, identifier], async (err, results) => {
    if (err) {
      console.error("Login query error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid username/email or password" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res
        .status(401)
        .json({ error: "Invalid username/email or password" });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
    };

    res.json({ message: "Login successful!" });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

app.post("/user/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized. Please login." });
  }

  const userId = req.session.user.id;

  const sql = "SELECT password_hash FROM users WHERE id = ?";
  connection.query(sql, [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      results[0].password_hash,
    );
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    connection.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hashed, userId],
      (err2) => {
        if (err2) {
          return res.status(500).json({ error: "Failed to update password" });
        }
        res.json({ message: "✅ Password changed successfully!" });
      },
    );
  });
});

// Forgot Password Route
app.post("/user/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
  connection.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No account found with this email" });
    }

    const user = results[0];
    const newPassword = generateRandomPassword(8, user.firstname);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSQL = "UPDATE users SET password_hash = ? WHERE id = ?";
    connection.query(
      updateSQL,
      [hashedPassword, user.id],
      async (updateErr) => {
        if (updateErr) {
          console.error("❌ Failed to update password:", updateErr);
          return res.status(500).json({ error: "Failed to reset password" });
        }
        try {
          await require("./models/credentials").sendCredentials(
            user.email,
            user.firstname,
            user.lastname,
            user.username,
            newPassword,
          );
          res.json({
            message: "✅ A new password has been sent to your email.",
          });
        } catch (mailErr) {
          console.error("Failed to send reset email:", mailErr);
          res.status(500).json({ error: "Failed to send reset email" });
        }
      },
    );
  });
});

app.post("/user/register", async (req, res) => {
  const { firstname, lastname, email, dob, phone } = req.body;

  //Validate required fields
  if (!firstname || !lastname || !email) {
    return res
      .status(400)
      .send("Missing required fields (firstname, lastname, email required)");
  }

  try {
    const checkEmailSQL = "SELECT * FROM users WHERE email = ? LIMIT 1";
    connection.query(checkEmailSQL, [email], async (err, results) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.status(500).send("Database error");
      }

      if (results.length > 0) {
        return res.status(400).send("❌ Email already registered!");
      }

      //  Generate username and random password
      const username = generateUsername(firstname);
      const plainPassword = generateRandomPassword(8, firstname);

      // Hash password
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      //insert new user
      const insertSQL = `INSERT INTO users (firstname, lastname, username, email, password_hash, dob,phone) VALUES (?, ?, ?, ?, ?, ?, ?)`;

      connection.query(
        insertSQL,
        [
          firstname,
          lastname,
          username,
          email,
          hashedPassword,
          dob || null,
          phone || null,
        ],
        async (err) => {
          if (err) {
            console.error("❌ Registration insert error:", err);
            return res.status(500).send("Database error");
          }

          //Send credentials email
          try {
            await sendCredentials(
              email,
              firstname,
              lastname,
              username,
              plainPassword,
            );
            console.log("Credentials sent to:", email);
          } catch (emailErr) {
            console.error("Error sending email:", emailErr);
          }

          //Respond to frontend
          res.redirect("/login");
        },
      );
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Internal server error");
  }
});

app.post("/user/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const now = Date.now();
  const record = otpStore[email];

  // ⏳ Block resend within 5 min if OTP still valid
  if (record && now < record.expiresAt) {
    const remaining = Math.ceil((record.expiresAt - now) / 1000);
    return res
      .status(400)
      .json({ error: `Wait ${remaining} seconds before requesting new OTP` });
  }
  const otp = generateOTP();
  otpStore[email] = { otp, expiresAt: now + 5 * 60 * 1000 };

  try {
    await sendOTP(email, otp);
    res.json({ message: "✅ OTP sent successfully! Valid for 5 minutes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/user/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record)
    return res
      .status(400)
      .json({ error: "No OTP found. Please request again." });
  if (Date.now() > record.expiresAt)
    return res.status(400).json({ error: "OTP expired. Request again." });
  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  delete otpStore[email];
  res.json({ message: "OTP verified successfully!" });
});

//==========MAIN ROTUES=================
//Query Route -> Search by disease name
app.get("/search-page", (req, res) => {
  res.render("search.ejs");
});

// Results page
app.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.render("result", { result: null });
  res.redirect(`/map/${q}`);
});

app.get("/lookup", (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    const sortBy = req.query.sort || "none";
    if (!q) return res.status(400).json({ message: "Missing query" });

    let matches = concepts
      .filter((item) =>
        Object.values(item)
          .filter(Boolean)
          .some((val) => val.toString().toLowerCase().includes(q)),
      )
      .map((item) => {
        const formatted = formatDefinition(item.long_definition);
        return {
          ...item,
          full_long_definition: item.long_definition,
          long_definition: item.long_definition
            ? item.long_definition.split(" ").slice(0, 10).join(" ") + " ..."
            : item.long_definition,
          formatted_definition: formatted,
          icdPublicUri: item.NUMC_CODE
            ? `https://icd.who.int/browse/2025-01/mms/en#${item.NUMC_CODE}`
            : null,
        };
      });

    //Sorting logic with "none"
    if (sortBy === "code") {
      matches = matches.sort((a, b) =>
        (a.code || "").localeCompare(b.code || ""),
      );
    } else if (sortBy === "term") {
      matches = matches.sort((a, b) =>
        (a.term || "").localeCompare(b.term || ""),
      );
    }
    if (matches.length === 1) {
      return res.redirect(`/map/${matches[0].NUMC_CODE}`);
    }
    res.render("query.ejs", { results: matches, query: q, sortBy });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/map/:code", async (req, res) => {
  try {
    const ICD_API_KEY = await getToken();
    const code = req.params.code.toUpperCase();

    const match = concepts.find((row) => row.code?.toUpperCase() === code);
    if (!match) {
      return res
        .status(404)
        .json({ message: "Code not found in NAMASTE dataset" });
    }

    const response = {
      system: match.system || "",
      namasteCode: match.code,
      term: match.term || "-",
      devnagari: match.devnagari,
      short_definition: match.short_definition,
      long_definition: match.long_definition,
      icd11Bio: "",
      icdEntityUri: "",
      icdPublicUri: "",
      icdDetails: {},
      icd11TM1: "",
      icdDetailsTM1: {},
      icd11TM2: "",
      icdDetailsTM2: {},
    };

    //WHO ICD-11 Bio lookup
    if (ICD_API_KEY) {
      const headers = {
        Accept: "application/json",
        "API-Version": "v2",
        "Accept-Language": "en",
        Authorization: `Bearer ${ICD_API_KEY}`,
      };

      const baseQuery = match.short_definition || match.term;
      const queries = [
        cleanQuery(baseQuery),
        cleanQuery(match.term),
        cleanQuery(baseQuery.split(" ").slice(0, 2).join(" ")),
      ];

      try {
        const topEntity = await trySearch(queries, headers);
        if (topEntity) {
          response.icd11Bio = topEntity.theCode?.split("/")?.[0] || "";
          response.icdEntityUri = topEntity.id || "";
          response.icdDetails = topEntity;

          if (topEntity.matchingPVs?.length > 0) {
            const foundationUri = topEntity.matchingPVs[0].foundationUri;
            const entityId = foundationUri.split("/").pop();
            response.icdPublicUri = `https://icd.who.int/browse/2025-01/mms/en#${entityId}`;
          }
        }
      } catch (err) {
        console.error("WHO API search failed:", err.message);
      }
    }

    //TM1 / TM2 lookup
    let queryTerm = stripHumours(match.short_definition || match.term);
    queryTerm = applySynonyms(queryTerm);
    // console.log("Looking up TM1 for:", queryTerm);
    let tm1Match = findTM1Match(queryTerm);
    // console.log("Looking up TM2 for:", queryTerm);
    let tm2Match = findTM2Match(queryTerm);
    if (!tm1Match && queryTerm.includes(" ")) {
      const keyword = queryTerm.split(" ").slice(0, 2).join(" ");
      // console.log("Retrying TM1 with keyword:", keyword);
      tm1Match = findTM1Match(keyword);
    }
    if (!tm2Match && queryTerm.includes(" ")) {
      const keyword = queryTerm.split(" ").slice(0, 2).join(" ");
      // console.log("Retrying TM2 with keyword:", keyword);
      tm2Match = findTM2Match(keyword);
    }

    //TM1 response
    if (tm1Match) {
      response.icd11TM1 = tm1Match.tm_code;
      response.icdDetailsTM1 = {
        disorder: tm1Match.disorder,
        module: tm1Match.module,
        url: tm1Match.url,
      };
    } else {
      response.icd11TM1 = "Not found";
      response.icdDetailsTM1 = {
        message:
          "TM1 dataset entry missing. Please check the official TM1 site.",
        redirect: "https://icd.who.int/browse/tm/en",
      };
    }

    //TM2 response
    if (tm2Match) {
      response.icd11TM2 = tm2Match.tm_code;
      response.icdDetailsTM2 = {
        disorder: tm2Match.disorder,
        module: tm2Match.module,
        url: tm2Match.url,
      };
    } else {
      response.icd11TM2 = "Not found";
      response.icdDetailsTM2 = {
        message:
          "TM2 dataset entry missing. Please check the official TM2 site.",
        redirect: "https://icd.who.int/browse/tm/en",
      };
    }

    // render result
    res.render("result.ejs", { response });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/terminology", ensureLoggedIn, (req, res) => {
  const sql = "SELECT * FROM translations ORDER BY created_at DESC LIMIT 20";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching translations:", err);
      return res.status(500).send("Database error");
    }
    res.render("terminology.ejs", { rows: results });
  });
});

// ================== FHIR Endpoints ==================

//Expand a ValueSet
app.get("/fhir/ValueSet/$expand", ensureLoggedIn, async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const results = concepts
      .filter((c) => c.term?.toLowerCase().includes(filter.toLowerCase()))
      .map((c) => ({
        system: c.system || "NAMASTE",
        code: c.code,
        display: c.term,
      }));

    res.json({
      resourceType: "ValueSet",
      status: "active",
      expansion: {
        timestamp: new Date().toISOString(),
        total: results.length,
        contains: results,
      },
    });
  } catch (err) {
    console.error("❌ FHIR $expand error:", err);
    res.status(500).json({ error: "FHIR $expand failed" });
  }
});

app.get("/fhir/ValueSet/$lookup", ensureLoggedIn, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code)
      return res.status(400).json({ error: "Missing ?code parameter" });

    const match = concepts.find(
      (c) => c.code?.toUpperCase() === code.toUpperCase(),
    );
    if (!match) {
      return res.json({
        resourceType: "ValueSet",
        status: "active",
        expansion: {
          timestamp: new Date().toISOString(),
          total: 0,
          contains: [],
        },
      });
    }

    res.json({
      resourceType: "ValueSet",
      status: "active",
      expansion: {
        timestamp: new Date().toISOString(),
        total: 1,
        contains: [
          {
            system: match.system || "NAMASTE",
            code: match.code,
            display: match.term,
          },
        ],
      },
    });
  } catch (err) {
    console.error("FHIR $lookup error:", err);
    res.status(500).json({ error: "FHIR $lookup failed" });
  }
});

function cleanHTML(str) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

async function doTranslation(codeOrMatch) {
  const match =
    typeof codeOrMatch === "string"
      ? concepts.find(
          (row) => row.code?.toUpperCase() === codeOrMatch.toUpperCase(),
        )
      : codeOrMatch;
  if (!match) return { mappings: [], match: null };

  let mappings = [];
  mappings.push({
    system: "NAMASTE",
    code: match.code,
    display: cleanHTML(match.term),
  });

  try {
    const ICD_API_KEY = await getToken();
    if (ICD_API_KEY) {
      const headers = {
        Accept: "application/json",
        "API-Version": "v2",
        "Accept-Language": "en",
        Authorization: `Bearer ${ICD_API_KEY}`,
      };

      const baseQuery = match.short_definition || match.term;
      const queries = [
        cleanQuery(baseQuery),
        cleanQuery(match.term),
        cleanQuery(baseQuery.split(" ").slice(0, 2).join(" ")),
      ];

      let topEntity = null;
      for (const q of queries) {
        try {
          topEntity = await trySearch([q], headers);
          if (topEntity) break;
        } catch (err) {
          console.error("WHO search failed for query:", q, err.message);
        }
      }

      if (topEntity) {
        mappings.push({
          system: "ICD11-Bio",
          code: topEntity.theCode || topEntity.code || "",
          display: cleanHTML(topEntity.title || topEntity.term || "-"),
        });
      }
    }
  } catch (err) {
    console.error("ICD-11 Bio lookup failed:", err.message);
  }

  let queryTerm = stripHumours(match.short_definition || match.term);
  queryTerm = applySynonyms(queryTerm);

  let tm1Match = findTM1Match(queryTerm);
  if (!tm1Match && queryTerm.includes(" "))
    tm1Match = findTM1Match(queryTerm.split(" ").slice(0, 2).join(" "));
  if (tm1Match)
    mappings.push({
      system: "ICD11-TM1",
      code: tm1Match.tm_code,
      display: cleanHTML(tm1Match.disorder),
    });

  let tm2Match = findTM2Match(queryTerm);
  if (!tm2Match && queryTerm.includes(" "))
    tm2Match = findTM2Match(queryTerm.split(" ").slice(0, 2).join(" "));
  if (tm2Match)
    mappings.push({
      system: "ICD11-TM2",
      code: tm2Match.tm_code,
      display: cleanHTML(tm2Match.disorder),
    });

  return { mappings, match };
}

app.get("/fhir/ConceptMap/$translate", ensureLoggedIn, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing ?q parameter" });

    const { mappings } = await doTranslation(q);
    const uniqueMappings = Array.from(
      new Map(mappings.map((m) => [m.system + m.code, m])).values(),
    );

    res.json({
      resourceType: "Parameters",
      parameter: uniqueMappings.map((m) => ({
        name: "match",
        valueCoding: {
          system: m.system,
          code: m.code,
          display: cleanHTML(m.display),
        },
      })),
    });
  } catch (err) {
    console.error("FHIR translate GET error:", err);
    res.status(500).json({ error: "FHIR translate failed" });
  }
});

// POST translate
app.post("/fhir/ConceptMap/$translate", ensureLoggedIn, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Missing code" });
    const match = concepts.find(
      (row) => row.code?.toUpperCase() === code.toUpperCase(),
    );
    if (!match) {
      return res.render("translate-result.ejs", {
        mappings: [],
        user: req.session?.user || null,
      });
    }

    let mappings = [];
    mappings.push({ system: "NAMASTE", code: match.code, display: match.term });

    const ICD_API_KEY = await getToken();
    if (ICD_API_KEY) {
      const headers = {
        Accept: "application/json",
        "API-Version": "v2",
        "Accept-Language": "en",
        Authorization: `Bearer ${ICD_API_KEY}`,
      };

      const baseQuery = match.short_definition || match.term;
      const queries = [
        cleanQuery(baseQuery),
        cleanQuery(match.term),
        cleanQuery(baseQuery.split(" ").slice(0, 2).join(" ")),
      ];

      let topEntity = null;
      for (const q of queries) {
        try {
          topEntity = await trySearch([q], headers);
          if (topEntity) break;
        } catch (err) {
          console.error("WHO search failed for query:", q, err.message);
        }
      }

      if (topEntity) {
        mappings.push({
          system: "ICD11-Bio",
          code: topEntity.theCode || topEntity.code || "",
          display:
            cleanHTML(topEntity.title) ||
            cleanHTML(topEntity.term) ||
            cleanHTML(topEntity.name) ||
            "-",
        });
      }
    }

    // ------------------- TM1 / TM2 -------------------
    let queryTerm = stripHumours(match.short_definition || match.term);
    queryTerm = applySynonyms(queryTerm);

    let tm1Match = findTM1Match(queryTerm);
    if (!tm1Match && queryTerm.includes(" ")) {
      tm1Match = findTM1Match(queryTerm.split(" ").slice(0, 2).join(" "));
    }
    if (tm1Match) {
      mappings.push({
        system: "ICD11-TM1",
        code: tm1Match.tm_code,
        display: tm1Match.disorder,
      });
    }

    let tm2Match = findTM2Match(queryTerm);
    if (!tm2Match && queryTerm.includes(" ")) {
      tm2Match = findTM2Match(queryTerm.split(" ").slice(0, 2).join(" "));
    }
    if (tm2Match) {
      mappings.push({
        system: "ICD11-TM2",
        code: tm2Match.tm_code,
        display: tm2Match.disorder,
      });
    }
    mappings.forEach((m) => {
      const sql = `INSERT INTO translations (source_system, source_code, source_display, target_system, target_code, target_display) VALUES (?, ?, ?, ?, ?, ?)`;
      connection.query(sql, [
        "NAMASTE",
        match.code,
        match.term,
        m.system,
        m.code,
        m.display,
      ]);
    });

    // res.render("translate-result.ejs", { mappings, user: req.session?.user || null });
    res.render("translate-result.ejs", { mappings, saved: [], rows: [] });
  } catch (err) {
    console.error("FHIR translate error", err);
    res.status(500).json({ error: "FHIR translate failed" });
  }
});

// Reload datasets
app.post("/fhir/$sync", ensureLoggedIn, async (req, res) => {
  try {
    await loadAllCSVs();
    res.json({ message: "FHIR sync complete. Mappings reloaded." });
  } catch (err) {
    console.error("Sync failed:", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

app.post("/fhir/Encounter/$upload", ensureLoggedIn, async (req, res) => {
  let bundle = req.body.bundle;

  // Handle raw JSON string
  if (typeof bundle === "string") {
    try {
      bundle = JSON.parse(bundle);
    } catch (err) {
      console.error("JSON parse failed:", err);
      return res.status(400).json({ error: "Invalid JSON format in bundle" });
    }
  }

  if (!bundle || !bundle.entry) {
    return res.status(400).json({ error: "Invalid FHIR bundle structure" });
  }

  const encounter = bundle.entry.find(
    (e) => e.resource.resourceType === "Encounter",
  );
  if (encounter) {
    const reason = encounter.resource.reasonCode?.[0];
    if (reason && reason.coding?.length === 1) {
      const baseCode = reason.coding[0].code;
      const result = await doTranslation(baseCode);
      if (result?.mappings) {
        reason.coding.push(
          ...result.mappings
            .filter((m) => m.system !== "NAMASTE")
            .map((m) => ({
              system: m.system,
              code: m.code,
              display: m.display,
            })),
        );
      }
    }
  }

  const patientEntry = bundle.entry.find(
    (e) => e.resource.resourceType === "Patient",
  );
  const patientId = patientEntry ? patientEntry.resource.id : "unknown";

  const sqlCheck = "SELECT COUNT(*) AS count FROM bundles WHERE patient_id = ?";
  connection.query(sqlCheck, [patientId], (err, rows) => {
    if (err) {
      console.error("Database check failed:", err);
      return res.status(500).json({ error: "Database query error" });
    }

    if (rows[0].count > 0) {
      console.warn(`Duplicate ID detected: ${patientId}`);
      return res
        .status(400)
        .json({
          error: `Patient ID '${patientId}' already exists. Please use a new ID.`,
        });
    }

    const sqlInsert = "INSERT INTO bundles (patient_id, bundle) VALUES (?, ?)";
    connection.query(sqlInsert, [patientId, JSON.stringify(bundle)], (err2) => {
      if (err2) {
        console.error("Error saving bundle:", err2);
        return res.status(500).json({ error: "Database insert error" });
      }
      res.json({
        message: `FHIR bundle stored successfully of pateint with ${patientId}`,
      });
    });
  });
});

app.delete("/fhir/translation", (req, res) => {
  const sql = "DELETE FROM translations";
  connection.query(sql, (err, result) => {
    if (err) {
      console.error("Failed to clear translations:", err);
      return res.status(500).send("Failed to clear translations");
    }
    res.redirect("/terminology");
  });
});

//Get details based on id
app.get("/fhir/Encounter", ensureLoggedIn, (req, res) => {
  const patientId = req.query.patientId;

  if (!patientId) return res.status(400).json({ error: "Missing patientId" });

  const sql = "SELECT * FROM bundles WHERE patient_id = ?";
  connection.query(sql, [patientId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    res.json({
      resourceType: "Bundle",
      type: "searchset",
      total: results.length,
      entry: results.map((r) => ({
        fullUrl: `urn:uuid:${r.id}`,
        resource:
          typeof r.bundle === "string" ? JSON.parse(r.bundle) : r.bundle,
        patientId: r.patient_id,
        created: r.created_at,
      })),
    });
  });
});

app.get("/fhir", ensureLoggedIn, (req, res) => {
  res.render("fhir");
});

app.get("/fhir/template", ensureLoggedIn, (req, res) => {
  res.render("fhirTemplate.ejs");
});

//==================================================================================
//==============CHATBOT=============================================================
//==================================================================================
// Chatbot route
app.get("/chat", (req, res) => {
  res.render("chat.ejs");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
