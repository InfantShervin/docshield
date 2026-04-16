# Docshield 🛡️

I built this scanner to help developers and privacy-conscious folks scan their documents for leaked PII (Personally Identifiable Information). It uses a custom model and a Supabase backend to identify things like Aadhaar numbers, PAN cards, emails, and credit card info before you accidentally share them.

### What it does
- **Smart Scanning**: Finds IDs, card numbers, and secret keys in images and PDFs.
- **Risk Scoring**: Gives you a clear 0-100 score so you know how "exposed" a document is.
- **Helpful Context**: Explains *why* something was flagged and what regulations (like GDPR) might apply.
- **Privacy Assistant**: A chat interface to ask questions about the analysis.

### Running it locally

You'll need Python 3.8+ and Node.js.

#### 1. Backend Setup
1. Head into the `backend` folder: `cd backend`.
2. Grab the dependencies: `pip install -r requirements.txt`.
   - *Note*: You'll need **Poppler** installed on your system for PDF scanning to work.
3. Set up your `.env` file (see `.env.example`).
4. Fire it up: `uvicorn app.main:app --reload`.

#### 2. Frontend Setup
1. In a new terminal, go to `frontend`.
2. Install everything: `npm install`.
3. Start the dev server: `npm run dev`.

### Why I built this
Most "AI" document scanners are corporate products that want your data. I wanted something that I could run locally to check my own files before uploading them anywhere. It's not perfect, but it's a lot better than manual checking.

### Roadmap
- [ ] Add more regional ID patterns (looking for contributors!)
- [ ] Batch processing for entire folders
- [ ] Better PDF text layer extraction (without OCR when possible)
