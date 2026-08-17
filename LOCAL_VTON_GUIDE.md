# Local IDM-VTON & RTX 4060 Execution Guide

To transition from the offline bridge skeleton to real AI-powered clothing replacement on your Predator Neo (RTX 4060, 8GB VRAM, 32GB RAM), follow these steps in your Windows PowerShell.

## Step 1: Verify CUDA & PyTorch GPU Support
Your RTX 4060 has 8GB VRAM. To run IDM-VTON locally with low-VRAM optimizations (`enable_model_cpu_offload()` and FP16 precision), you need PyTorch installed with CUDA support.

Run this check in PowerShell:
```powershell
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```
If it prints `CUDA Available: True`, your GPU is ready. If it prints `False`, install the CUDA-enabled PyTorch build:
```powershell
pip uninstall torch torchvision -y
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

## Step 2: Clone the Official IDM-VTON Repository
In your project folder (`C:\Users\ibrah\Projects\ai-wardrobe-new`), clone the official model repository so the Python server can load the pipeline:
```powershell
git clone https://github.com/yisol/IDM-VTON.git
```

## Step 3: Download Model Weights & Checkpoints
IDM-VTON relies on Stable Diffusion XL (SDXL) inpainting, IP-Adapter, DensePose, and human parsing checkpoints.
1. Download model checkpoints from [Hugging Face IDM-VTON](https://huggingface.co/yisol/IDM-VTON) [2].
2. Place human parsing and DensePose files under `IDM-VTON/ckpt/`:
   - `ckpt/densepose/model_final_162be9.pkl`
   - `ckpt/humanparsing/parsing_atr.onnx`
   - `ckpt/humanparsing/parsing_lip.onnx`

## Step 4: Run the Full Local VTON Server
Once weights and dependencies are in place, update `server/local_vton_server.py` to initialize the official `TryonPipeline` from `IDM-VTON`, and start it:
```powershell
python server/local_vton_server.py
```
