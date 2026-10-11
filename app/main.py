
from fastapi import FastAPI

app = FastAPI(
    title="Geospatial File Measurement API",
    description="Upload geospatial files and calculate geometry measurements.",
    version="1.0.0",
)


@app.get("/")
def home():
    return {
        "message": "Geospatial Measurement API is running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
