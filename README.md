# DocShield

DocShield is a document analysis and exposure detection system.

## Running Locally

Follow these instructions to run the application on your computer after downloading or cloning the GitHub repository.

### Prerequisites
1. **Python 3.8+**
2. **Node.js (v14+ or latest LTS)**
3. **Poppler**: (Required for PDF processing)
   - *Windows*: You can use the `poppler.zip` included in this repository. Extract it and add the `bin` directory to your system's PATH environment variable.
   - *macOS*: `brew install poppler`
   - *Linux (Ubuntu/Debian)*: `sudo apt-get install poppler-utils`

### 1. Backend Setup

The backend is built with Python and FastAPI. The pre-trained model (`sgat_layoutlm_model.pth`) is already included in the `backend/` directory of this repository!

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup

The frontend is a React application powered by Vite.

1. Open a **new** terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the necessary Node packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be accessible at the local URL provided in the terminal (usually `http://localhost:5173`).


---

## Future Deployment Guide

If you decide to deploy the application to the web in the future, follow these general guidelines. *(Note: Deployment configurations have been intentionally removed from this repository to ensure a clean local-first environment).*

### Deploying the Backend
To deploy the Python backend, you typically use a platform like Render, Railway, or Heroku.
1. Create a `Dockerfile` in the `/backend` folder. Example:
   ```dockerfile
   FROM python:3.9-slim
   # Install poppler
   RUN apt-get update && apt-get install -y poppler-utils
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
2. Ensure you have a `.dockerignore` file so unnecessary files are not uploaded.
3. Push the code to GitHub and connect it to your hosting provider, ensuring the environment variables matches what your application needs.

### Deploying the Frontend
To deploy the React dashboard, you can use Vercel, Netlify, or Cloudflare Pages.
1. Make sure your API calls point to the deployed backend URL instead of `localhost`. Usually, you manage this using an `.env.production` file (e.g., `VITE_API_URL=https://your-backend-url.com`).
2. Connect your GitHub repository to Vercel or Netlify. The default Vite build settings (Build Command: `npm run build`, Output Directory: `dist`) will automatically work on these platforms.
