# AyuLinker – ICD-11 Mapping & Search API
## 🌿 SIH 2025 (Team TECH RIDERS)
A Node.js + Express application to map codes from the NAMASTE dataset with the WHO ICD-11 API.
It integrates ICD-11 Bio (MMS) and TM2 systems, supports CSV lookups, and renders results in an EJS dashboard.

# 📌 Features
1. Search codes in the NAMASTE dataset
2. Auto-maps to ICD-11 Bio (MMS) and ICD-11 TM2 via WHO API
3. CSV-based local lookup for terms and definitions
4. Frontend powered by EJS templates
5. Token-based authentication with WHO API
6. Responsive dashboard for result visualization

# ⚡ Prerequisites
1. Node.js v16+
2. npm (comes with Node.js)
3. .env file with valid WHO ICD API credentials

--- 

# 🔧 Installation & Setup
#### 1. Clone the repository
    git clone https://github.com/sagniksaha279/AyuLinker.git
    cd AyuLinker
#### 2. Install dependencies
    npm install
##### 3. Environment Variables
    Create a .env file in the root directory 
    👉 To get the actual .env file with valid credentials, contact Sagnik.
#### 4. Start the development server
    npm run dev
#### 5.Server will be available at: http://localhost:3000

---

# 📂 Project Structure
    ├── models/
    │   ├── csv.js          # Load and parse CSV datasets
    │   ├── getToken.js     # WHO API token management
    │   ├── trySearch.js    # Search utility for WHO API
    ├── views/
    │   ├── partials/       # Reusable EJS components
    │   ├── search.ejs      # Search input page
    │   ├── result.ejs      # Results display
    ├── public/             # Static assets (CSS, JS, images)
    ├── routes/
    │   ├── index.js        # Main application routes
    ├── server.js           # Main Express server
    ├── .env                # API credentials (not in git)
    ├── .env.example        # Example reference file
    ├── package.json
    └── README.md
    
---

# 📞 Support

For technical support or questions about this project, please contact : Tech Riders



# 📜 License

This project is developed for Smart India Hackathon 2025 by Team TECH RIDERS.

---

Innovation Today for a Smarter Tomorrow 🌟.
