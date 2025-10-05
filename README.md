# 🌿 **AyuLinker – ICD-11 Mapping & Search API**  
### 🚀 *Smart India Hackathon 2025 (Team TECH RIDERS)*  

AyuLinker is a **Node.js + Express** application that bridges India’s **NAMASTE Traditional Medicine Dataset** with the **WHO ICD-11 (MMS & TM2)** systems.  
It enables seamless **code mapping, search, and visualization** through a responsive **EJS-based dashboard**, improving interoperability between **AYUSH systems** and **global health records**.

---

## 🔗 **Live Demo**
🌐 **[AyuLinker](https://sih.kankangain.com)**  

---

## 📌 **Key Features**

1. 🔍 **Search** codes and descriptions from the NAMASTE dataset  
2. 🔗 **Auto-map** to ICD-11 Bio (MMS) and ICD-11 TM2 codes via WHO API  
3. 📂 **CSV-based local lookup** for offline term access  
4. 💻 **Dynamic EJS frontend** with modular, responsive UI  
5. 🔑 **Secure token-based authentication** for WHO API  
6. 📊 **Interactive dashboard** for mapped result visualization  

---

## 💡 **Problem Statement**

Manual integration of NAMASTE and ICD-11 TM2 codes in EMRs is:  
- ⏳ **Time-consuming** and manual  
- ❌ **Inconsistent** across hospitals and systems  
- 📄 **Non-interoperable** with national EHR frameworks  
- 📉 **Lacking analytics** for policymaking and research  

---

### 🧩 **Root Causes**
- 🗣️ Linguistic and regional variations in traditional medicine terms  
- 🚫 Absence of a standardized mapping workflow  
- 🔄 Regular ICD-11 & NAMASTE dataset updates requiring re-mapping  
- 🧮 Manual data handling leading to low accuracy and adoption  

---

## 🧠 **Proposed Solution**

AyuLinker provides a **FHIR-compliant, automated integration engine** to connect Indian Traditional Medicine datasets with international health standards.  

**Core Capabilities:**
- 🔗 **Auto-Mapping Engine:** NAMASTE ↔ ICD-11 TM2 ↔ Biomedicine  
- ⚙️ **FHIR APIs:** Search, translation, and bundle upload  
- 🔒 **ABHA-linked OAuth 2.0 Security** with ISO-22600 compliance  
- 📊 **Analytics-Ready Dashboards** for AYUSH morbidity insights  
- 🤖 **AI Chatbot** for symptom-based ICD-11 code recommendations  

---

## 🌱 **Future Scope**

- 🧬 **SNOMED CT** and **LOINC** integration for diagnostics and labs  
- 📱 **QR-based patient record retrieval** for AYUSH practitioners  
- 🧠 **Predictive analytics** for early outbreak detection  
- 📈 **Real-time health dashboards** for policymakers and MoA  

---

## 🔧 **Installation & Setup**

#### 1. Clone the Repository
    git clone https://github.com/sagniksaha279/AyuLinker.git
    cd AyuLinker
#### 2. Install dependencies
    npm install
#### 3. Configure Environment Variables
    Create a .env file in the root directory.
    ⚠️ To obtain the valid .env file (with credentials), contact 📧 Sagnik Saha: sahasagnik279@gmail.com
#### 4. Start the development server
    npm run dev
    OR node app.js
#### 5. Server will be available at: http://localhost:25579

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
    📧 Tech Riders Team: contacttechriders@gmail.com

---

# 📜 License
This project is developed for Smart India Hackathon 2025 by Team TECH RIDERS.

---
Innovation Today for a Smarter Tomorrow 🌟.
