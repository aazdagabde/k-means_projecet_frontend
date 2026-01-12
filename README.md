
# SmartSeg AI - Backend API 🧠

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?style=for-the-badge)

## 📋 Overview

The **SmartSeg AI Backend** is a high-performance REST API designed to automate customer segmentation. It acts as the intelligent core of the SmartSeg platform, handling data processing, machine learning clustering, and AI-driven analysis.

The system ingests raw transactional data (CSV), transforms it into **RFM (Recency, Frequency, Monetary)** metrics, applies **K-Means Clustering**, and leverages **Google's Gemini 2.5 Flash** model to generate qualitative marketing strategies for each identified segment.

## 🚀 Key Features

* **⚡ High-Performance API:** Built with FastAPI for low latency and automatic Swagger documentation.
* **📊 Automated RFM Analysis:** Cleans and converts raw invoice data into marketing metrics.
* **🤖 Unsupervised Learning:** Dynamic K-Means clustering with `StandardScaler` normalization.
* **🧠 Generative AI Integration:** Uses Gemini 2.5 Flash to interpret cluster centroids and suggest marketing actions (Retention, Upsell, etc.).
* **💾 Data Persistence:** Stores analysis history, metrics (Inertia, Silhouette Score), and metadata in MongoDB.
* **📈 Advanced Metrics:** Calculates feature importance to understand which variables (R, F, or M) drive the segmentation.

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Language** | Python 3.9+ | Core programming language |
| **Framework** | FastAPI | Asynchronous web framework |
| **Server** | Uvicorn | ASGI server implementation |
| **Database** | MongoDB | NoSQL database for storing analysis results |
| **ML Library** | Scikit-learn | K-Means, Silhouette Score, StandardScaler |
| **Data Proc.** | Pandas / NumPy | Data manipulation and vectorization |
| **LLM** | Google GenAI | Gemini 2.5 Flash via `google-genai` SDK |

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/smartseg-backend.git](https://github.com/your-username/smartseg-backend.git)
cd smartseg-backend

```

### 2. Create a Virtual Environment

It is recommended to use a virtual environment to manage dependencies.

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

```

### 3. Install Dependencies

```bash
pip install -r requirements.txt

```

### 4. Configuration

Create a `.env` file in the root directory and add your API keys:

```env
# Google Gemini API Key (Get it from Google AI Studio)
GEMINI_API_KEY=your_actual_api_key_here

# MongoDB Connection String (Default local instance)
MONGO_URI=mongodb://localhost:27017/
DB_NAME=smartseg_db

```

### 5. Start the Server

Make sure your MongoDB instance is running, then start the API:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000

```

The API will be live at `http://127.0.0.1:8000`.

## 🔌 API Endpoints

Full interactive documentation is available at `http://127.0.0.1:8000/docs`.

### Core Analysis

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/analyze` | Uploads a CSV file, performs RFM + K-Means + AI Analysis, and saves the result. |

**Parameters:**

* `file`: CSV file (Required columns: `CustomerID`, `InvoiceDate`, `Quantity`, `UnitPrice`)
* `k`: Number of clusters (default: 3)
* `delimiter`: CSV separator (`,` or `;`)

### History Management

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/history` | Returns a list of past analyses (lightweight summary). |
| `GET` | `/history/{id}` | Returns the full detailed analysis for a specific ID. |

## 📂 Project Structure

```text
server/
├── main.py              # Application entry point and logic
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (gitignored)
└── README.md            # Project documentation

```

## 🧪 Data Pipeline Workflow

1. **Ingestion:** API receives a CSV file via `multipart/form-data`.
2. **Preprocessing:**
* Missing values dropped.
* `TotalAmount` calculated (`Quantity` * `UnitPrice`).
* Data aggregated by `CustomerID` to calculate RFM.


3. **Clustering:**
* Data normalized using `StandardScaler`.
* K-Means algorithm applied with user-defined `k`.


4. **Enrichment (AI):**
* Cluster centers sent to Gemini 2.5.
* LLM returns names, descriptions, and strategies for each cluster in JSON format.


5. **Storage:** Full JSON object stored in MongoDB `analyses` collection.

## 👥 Author

**Abdellah Aazdag**
*Engineering Student, ITIRC*
*National School of Applied Sciences (ENSA), Oujda*

**SALMA BOUSSLAMA**
*Engineering Student, ITIRC*
*National School of Applied Sciences (ENSA), Oujda*

---

*Developed as part of a Data Mining & AI integration project.*

