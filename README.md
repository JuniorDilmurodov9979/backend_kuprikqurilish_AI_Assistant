# Backend Kuprik Qurilish – AI Assistant

This repository contains the **backend service** for the Kuprik Qurilish AI Assistant.

The assistant is designed to:
- Navigate through application pages
- Answer user questions contextually
- Enforce daily usage limits
- Communicate with OpenAI (`gpt-4o-mini`) for responses

---

## 🚀 Core Features

- AI-powered **question & answer system**
- Page-aware navigation support
- **Daily request limit** (10 requests per user every 12 hours)
- OpenAI **GPT-4o-mini** integration
- User authentication & request tracking
- RESTful API for frontend consumption

---

## 🧠 AI Logic

- Model used: **gpt-4o-mini**
- Each authenticated user can send **up to 10 AI requests every 12 hours**
- Requests are counted and validated on the backend
- When the limit is reached, the API returns a blocked response

---

## 🛠 Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** PostgreSQL / MongoDB  
- **AI Provider:** OpenAI (GPT-4o-mini)  
- **Authentication:** JWT  
- **API Testing:** Postman  

---

## 📂 Project Structure

```bash
backend_kuprikqurilish_AI_Assistant/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── utils/
│   └── app.js
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/JuniorDilmurodov9979/backend_kuprikqurilish_AI_Assistant.git
cd backend_kuprikqurilish_AI_Assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment variables**
```bash
cp .env.example .env
```

Required variables:
- `OPENAI_API_KEY`
- `JWT_SECRET`
- Database connection values

4. **Run the server**
```bash
npm run dev
```

---

## 🔐 Authentication

- JWT-based authentication
- Protected routes require an access token

```http
Authorization: Bearer <token>
```

---

## 📡 Example API Flow

**Ask a question**
```http
POST /api/assistant/ask
```

**Response**
```json
{
  "answer": "You can manage projects from the dashboard page.",
  "remainingRequests": 6
}
```

If daily limit exceeded:
```json
{
  "error": "Daily AI request limit reached"
}
```

---

## 📌 Notes

- This backend **only provides logic and AI responses**
- UI and navigation rendering are handled by the frontend
- Daily limits reset automatically every 12 hours
- Designed for scalability and controlled AI usage

---

## 👤 Author

**Junior Dilmurodov**  
Frontend / Backend Engineer

---

## 📄 License

Private project — internal use only.# Backend Kuprik Qurilish – AI Assistant

This repository contains the **backend service** for the Kuprik Qurilish AI Assistant.

The assistant is designed to:
- Navigate through application pages
- Answer user questions contextually
- Enforce daily usage limits
- Communicate with OpenAI (`gpt-4o-mini`) for responses

---

## 🚀 Core Features

- AI-powered **question & answer system**
- Page-aware navigation support
- **Daily request limit** (10 requests per user every 12 hours)
- OpenAI **GPT-4o-mini** integration
- User authentication & request tracking
- RESTful API for frontend consumption

---

## 🧠 AI Logic

- Model used: **gpt-4o-mini**
- Each authenticated user can send **up to 10 AI requests every 12 hours**
- Requests are counted and validated on the backend
- When the limit is reached, the API returns a blocked response

---

## 🛠 Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** PostgreSQL / MongoDB  
- **AI Provider:** OpenAI (GPT-4o-mini)  
- **Authentication:** JWT  
- **API Testing:** Postman  

---

## 📂 Project Structure

```bash
backend_kuprikqurilish_AI_Assistant/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── utils/
│   └── app.js
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/JuniorDilmurodov9979/backend_kuprikqurilish_AI_Assistant.git
cd backend_kuprikqurilish_AI_Assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment variables**
```bash
cp .env.example .env
```

Required variables:
- `OPENAI_API_KEY`
- `JWT_SECRET`
- Database connection values

4. **Run the server**
```bash
npm run dev
```

---

## 🔐 Authentication

- JWT-based authentication
- Protected routes require an access token

```http
Authorization: Bearer <token>
```

---

## 📡 Example API Flow

**Ask a question**
```http
POST /api/assistant/ask
```

**Response**
```json
{
  "answer": "You can manage projects from the dashboard page.",
  "remainingRequests": 6
}
```

If daily limit exceeded:
```json
{
  "error": "Daily AI request limit reached"
}
```

---

## 📌 Notes

- This backend **only provides logic and AI responses**
- UI and navigation rendering are handled by the frontend
- Daily limits reset automatically every 12 hours
- Designed for scalability and controlled AI usage

---

## 📄 License

Private project — internal use only.
