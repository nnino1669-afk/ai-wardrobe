import os
import base64
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from io import BytesIO
from PIL import Image

app = FastAPI(title="AI Wardrobe Local VTON Proxy (Port 8000 -> 7860)")

GRADIO_URL = os.getenv("GRADIO_URL", "http://127.0.0.1:7860")

print(f"[Local VTON Proxy] Initialized. Forwarding try-on requests to Gradio backend at {GRADIO_URL}")

class TryOnRequest(BaseModel):
    person_image_url: str
    garment_image_url: str
    category: str = "upper"
    prompt: str = ""
    steps: int = 15

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "proxy_target": GRADIO_URL,
        "mode": "local_rtx4060_bridge"
    }

@app.post("/v1/vton/try-on")
def run_local_tryon(req: TryOnRequest):
    try:
        from gradio_client import Client, handle_file
        import tempfile

        print(f"[Local VTON Proxy] Connecting to local Gradio instance at {GRADIO_URL}...")
        client = Client(GRADIO_URL)

        # Helper to materialize image URLs or base64 into temporary files for gradio_client
        def prepare_image(url_or_data: str) -> str:
            if url_or_data.startswith("data:"):
                header, encoded = url_or_data.split(",", 1)
                binary = base64.b64decode(encoded)
                img = Image.open(BytesIO(binary)).convert("RGB")
            elif url_or_data.startswith("http://") or url_or_data.startswith("https://"):
                import requests
                resp = requests.get(url_or_data, timeout=30)
                resp.raise_for_status()
                img = Image.open(BytesIO(resp.content)).convert("RGB")
            else:
                img = Image.open(url_or_data).convert("RGB")

            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            img.save(tmp.name, "PNG")
            tmp.close()
            return tmp.name

        person_path = prepare_image(req.person_image_url)
        garment_path = prepare_image(req.garment_image_url)

        print("[Local VTON Proxy] Invoking Gradio /tryon prediction...")
        result = client.predict(
            dict={
                "background": handle_file(person_path),
                "layers": [],
                "composite": None,
            },
            garm_img=handle_file(garment_path),
            garment_des=req.prompt or "Virtual try-on, RTX 4060 optimized.",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=req.steps,
            seed=42,
            api_name="/tryon"
        )

        # Cleanup temp files
        try:
            os.unlink(person_path)
            os.unlink(garment_path)
        except Exception:
            pass

        result_url = None
        if isinstance(result, (list, tuple)) and len(result) > 0:
            first = result[0]
            if isinstance(first, str):
                result_url = first
            elif isinstance(first, dict):
                result_url = first.get("url") or first.get("path")

        if not result_url:
            raise HTTPException(status_code=500, detail="Local Gradio backend returned no valid image URL")

        print(f"[Local VTON Proxy] Try-on successful! Result URL: {result_url}")
        return {"result_url": result_url, "success": True}

    except Exception as e:
        print(f"[Local VTON Proxy] Error during proxy try-on: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
