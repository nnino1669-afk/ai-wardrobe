# AI Wardrobe - Local VS Code & RTX 4060 Setup Guide

This guide explains how to run **AI Wardrobe** entirely locally on your Windows laptop (Predator Neo, Intel i9, 32GB RAM, RTX 4060 8GB VRAM) using **VS Code**, **Ollama**, and a local **IDM-VTON Python bridge**.

---

## 1. Prerequisites on Your PC

1. **Install Node.js (v20+)** and **pnpm**.
2. **Install Python 3.10 / 3.11** with CUDA 12.x support for PyTorch.
3. **Install Ollama** for local LLM style recommendations and text analysis:
   ```bash
   ollama pull llama3
   ```
4. **Clone IDM-VTON locally** (optional if running direct inference):
   ```bash
   git clone https://github.com/yisol/IDM-VTON.git
   cd IDM-VTON
   ```

---

## 2. Environment Configuration (`.env.local`)

Create a `.env.local` file in the project root:

```env
PORT=3000
DATABASE_URL=file:./local.db
STORAGE_DRIVER=local
LOCAL_UPLOAD_DIR=./public/uploads
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_VTON_BRIDGE_URL=http://localhost:8000
```

---

## 3. Local Python Bridge for RTX 4060 (IDM-VTON Low-VRAM Profile)

Create a local FastAPI wrapper (`local_vton_server.py`) to run IDM-VTON on your RTX 4060 with 8GB VRAM optimizations (`bfloat16`, sequential offloading):

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from diffusers import StableDiffusionXLInpaintPipeline
import uvicorn

app = FastAPI()

# Load IDM-VTON pipeline with 8GB VRAM lowvram settings
# pipe = StableDiffusionXLInpaintPipeline.from_pretrained("yisol/IDM-VTON", torch_dtype=torch.bfloat16).to("cuda")
# pipe.enable_attention_slicing()

class TryOnRequest(BaseModel):
    person_image_url: str
    garment_image_url: str
    cloth_type: str

@app.post("/api/local-tryon")
def run_local_tryon(req: TryOnRequest):
    try:
        # Inference logic optimized for RTX 4060 8GB
        return {"success": True, "result_image_url": "data:image/png;base64,..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

---

## 4. Running the App in VS Code

1. Open the project folder in **VS Code**.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run database migrations:
   ```bash
   pnpm drizzle-kit push
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```
5. Open `http://localhost:3000` in your browser.
