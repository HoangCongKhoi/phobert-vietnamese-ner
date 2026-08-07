from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ner_engine import ner_engine

app = FastAPI(
    title="PhoBERT Vietnamese NER API",
    description="FastAPI Backend for PhoBERT Named Entity Recognition (PhoNER_COVID19 Dataset)",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {
        "message": "PhoBERT Vietnamese NER API is running",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "is_real_model_loaded": ner_engine.is_real_model_loaded,
        "engine": "PyTorch PhoBERT" if ner_engine.is_real_model_loaded else "Smart Demo NER Engine"
    }

@app.post("/api/predict")
def predict_ner(payload: TextPayload):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text input cannot be empty.")
    
    result = ner_engine.predict(text)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
