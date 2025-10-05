# 🌿 AyuLinker – ICD-11 Mapping & Search API
## 🚀 SIH 2025 (Team TECH RIDERS)
A ⚙️ Node.js + Express application to map codes from the 🧾 NAMASTE dataset with the 🌍 WHO ICD-11 API.  
It integrates 💊 ICD-11 Bio (MMS) and TM2 systems, supports 📂 CSV lookups, and renders results in an interactive 🖥️ EJS dashboard.

---

## 🔗 Live Demo
🌐 **Visit Here:** [AyuLinker](https://sih.kankangain.com)

---

# 📌 Features
1. 🔍 Search codes in the NAMASTE dataset  
2. 🔗 Auto-maps to ICD-11 Bio (MMS) and ICD-11 TM2 via WHO API  
3. 📂 CSV-based local lookup for terms and definitions  
4. 💻 Frontend powered by EJS templates  
5. 🔑 Token-based authentication with WHO API  
6. 📊 Responsive dashboard for result visualization  

---
## 💡 Problem Statement
Manual integration of NAMASTE and ICD-11 TM2 codes in EMRs is:
- ⏳ Time-consuming and error-prone  
- ❌ Inconsistent across hospitals  
- 📄 Poorly interoperable with national EHR standards  
- 📉 Lacking in analytics and policy-level scalability  

---
### 🧩 Root Causes
- 🗣️ Linguistic variations in traditional medicine terminology  
- 🚫 No standardized mapping workflows  
- 🔄 Frequent ICD-11 and NAMASTE updates needing re-mapping  
- 🧮 Manual processes slowing adoption and accuracy  

---

## 🧠 Proposed Solution

AyuLinker provides:
- 🔗 **Auto-mapping engine** for NAMASTE ↔ ICD-11 TM2 ↔ Biomedicine  
- ⚙️ **FHIR-Compliant APIs** for search, translation, and bundle upload  
- 🔒 **ABHA-linked OAuth 2.0 security** and ISO-22600 compliance  
- 📊 **Analytics-ready dashboards** for AYUSH morbidity insights  
- 🤖 **AI Chatbot** for symptom-based code suggestions  

---

## 🌱 Future Scope

- 🧬 SNOMED CT and LOINC integration for labs and diagnostics  
- 📱 QR-based patient history and prescription retrieval  
- 🧠 Predictive healthcare: early outbreak detection via ML  
- 📈 Real-time disease monitoring dashboards for MoA and policymakers  

---

## 🌱 Future Scope
- SNOMED CT and LOINC integration for labs and diagnostics  
- QR-based patient history and prescription retrieval  
- Predictive healthcare: early outbreak detection via ML  
- Real-time disease monitoring dashboards for MoA and policymakers  

---

# 🔧 Installation & Setup
#### 1. Clone the repository
    git clone https://github.com/sagniksaha279/AyuLinker.git
    cd AyuLinker
#### 2. Install dependencies
    npm install
##### 3. Environment Variables
    Create a .env file in the root directory 
    👉 To get the actual .env file with valid credentials, contact Sagnik (📧sahasagnik279@gmail.com)
#### 4. Start the development server
    npm run dev
    OR node app.js
#### 5.Server will be available at: http://localhost:25579

---

# 📂 Project Structure
    ├── models/
    │   ├── csv.js          # Load and parse CSV datasets
    │   ├── getToken.js     # WHO API token management
    │   ├── trySearch.js    # Search utility for WHO API
    ├── views/
    │   ├── index.ejs       # Reusable EJS components
    │   ├── search.ejs      # Search input page
    │   ├── result.ejs      # Results display
    ├── public/             # Static assets (CSS, JS, images)
    ├── app.js           # Main Express server
    ├── .env                # API credentials (not in git)
    ├── package.json
    └── README.md
    
---

# 📞 Support
For technical support or questions about this project, please contact : Tech Riders
Mail us at : [📧Tech Riders](contacttechriders@gmail.com)

# 📜 License
This project is developed for Smart India Hackathon 2025 by Team TECH RIDERS.

---
Innovation Today for a Smarter Tomorrow 🌟.
