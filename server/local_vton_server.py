import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import requests
from io import BytesIO

app = FastAPI(title="AI Wardrobe Local VTON Bridge (RTX 4060 Optimized)")

# Low-VRAM configuration for 8GB RTX 4060
LOW_VRAM = os.getenv("LOW_VRAM", "true").lower() == "true"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"[Local VTON Bridge] Initializing on device: {DEVICE}, Low-VRAM mode: {LOW_VRAM}")

class TryOnRequest(BaseModel):
    person_image_url: str
    garment_image_url: str
    category: str = "upper_body"
    prompt: str = ""
    steps: int = 25

@app.get("/health")
def health_check():
    return {"status": "ok", "device": DEVICE, "low_vram": LOW_VRAM}

@app.post("/v1/vton/try-on")
def run_local_tryon(req: TryOnRequest):
    try:
        print(f"[Local VTON] Processing try-on for category: {req.category}")
        raise HTTPException(
            status_code=501,
            detail=(
                "Local Python VTON server is currently running in bridge skeleton mode. "
                "To run full IDM-VTON diffusion pipeline locally on your RTX 4060, clone https://github.com/yisol/IDM-VTON, "
                "download the model weights and checkpoints (DensePose, human parsing), and run the official inference.py or gradio_demo/app.py. "
                "Alternatively, you can configure a cloud inference token in the app settings."
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
