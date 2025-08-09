# 🐙 Octogen AI ✨

An intelligent assistant that seamlessly integrates with your GitHub workflow to **automatically generate high-quality unit tests** for your code.

Octogen AI is a **full-stack web application** designed to accelerate development and enhance code reliability.  
By leveraging the power of **generative AI**, it analyzes your source code and provides insightful **test case summaries** and ready-to-use, runnable code — so you can focus on building features while maintaining a robust test suite.

---

## 🚀 Key Features

- 🔐 **Secure GitHub Authentication** — Log in safely using GitHub OAuth2 (credentials are never stored).
- 📂 **Intuitive Repository Navigation** — Browse your public and private repositories with ease.
- 🤖 **AI-Powered Test Summaries** — Get test case suggestions for happy paths, edge cases, and error handling.
- ⚡ **One-Click Code Generation** — Generate runnable test code instantly in the right framework:
  - Pytest for Python
  - Jest for JavaScript/React
- 🎨 **Stunning & Responsive UI** — Modern glassmorphism design + dynamic aurora background, built with React + Tailwind CSS.

---

## 🛠️ Tech Stack & Architecture

```
[ User Browser ] <--> [ React Frontend (Vite) ]
       |
       | (API Calls)
       v
[ Node.js Backend (Express) ]
       |
       |------------------------+-----------------------+
       v                        v                       v
[ GitHub API ]      [ Google Gemini AI ]      [ Secure Cookies ]
(OAuth, Repo Data)    (Test Generation)       (Session Management)

```

---

## 🏁 Getting Started

Follow these steps to get a local copy of **Octogen AI** running.

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18+ recommended)  
- [Git](https://git-scm.com/)  
- A **GitHub Account** (for authentication)  
- A **Google AI API Key** ([Get one here](https://aistudio.google.com/))  

---

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/your-username/octogen-ai.git
cd octogen-ai
```
### **2️⃣ Configure the Backend**

**Navigate to backend:**
```bash
cd backend
```
Install dependencies:
```
npm install
```
**Create a GitHub OAuth App:**
1. Go to **GitHub Settings → Developer settings → OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name:** Octogen AI (Local)
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback`
3. Click **Register application**
4. Copy **Client ID** and **Client Secret**

**Set up `.env`:**
```env
# backend/.env

# GitHub OAuth App
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Google AI Key
GEMINI_API_KEY=your_google_ai_api_key_here
```

**Start the backend:**
```bash
npm start
```
> Runs at: [http://localhost:3000](http://localhost:3000)

---

### **3️⃣ Configure the Frontend**
```bash
cd ../frontend
npm install
npm run dev
```
> Opens at: [http://localhost:5173](http://localhost:5173)

---

## 📖 How to Use
1. **Login** — Click *Login with GitHub* and authorize.
2. **Select Repository** — Choose one.
3. **Navigate & Select Files** — Tick the files to analyze.
4. **Generate Summaries** — Click *Generate Summaries*.
5. **Generate Code** — Click *Code* next to a summary.

---

## 🤝 Contributing
```bash
# Fork & create feature branch
git checkout -b feature/AmazingFeature

# Commit changes
git commit -m 'Add some AmazingFeature'

# Push branch
git push origin feature/AmazingFeature
```
Then open a Pull Request 🎉

---

## 📜 License
MIT License — See the [LICENSE](LICENSE) file.
