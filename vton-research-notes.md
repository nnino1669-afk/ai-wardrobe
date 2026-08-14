# Virtual Try-On Research Notes

## CatVTON
Source: https://huggingface.co/zhengchong/CatVTON

The CatVTON model card describes a lightweight diffusion-based virtual try-on model with approximately 899 million parameters and simplified inference. The model card’s documented workflow is dataset-oriented: it expects VITON-HD or DressCode structure, image preprocessing, and generated masks/pose-related assets through scripts. The page references DensePose, SCHP, and mask preprocessing in the surrounding workflow. The model card also shows a **CC BY-NC-SA 4.0** license and indicates that this model page is not currently deployed by an Inference Provider.

## IDM-VTON
Source: https://huggingface.co/yisol/IDM-VTON

The IDM-VTON model card describes an image-to-image virtual try-on model built around diffusion/inpainting and links to the official demo and repository. Its official implementation uses auxiliary masking code based on OOTDiffusion and DCI-VTON, indicating that realistic placement depends on more than sending two arbitrary images. The model page also shows a **CC BY-NC-SA 4.0** license and indicates that the model is not currently deployed by an Inference Provider.

## Implementation implications

The current Hugging Face implementation must not imply guaranteed garment sizing or physical fit. It can preserve visual identity and pose only to the extent supported by the selected hosted model and preprocessing. The application should send absolute, fetchable person and garment image URLs, keep garment-category mapping explicit, and expose honest error states when a model/API cannot process a request. For stronger realism, a future inference adapter should add human parsing/masking and, where available, pose or DensePose preprocessing before calling a model that explicitly supports those inputs.

## Hugging Face Spaces / Gradio

Sources: https://huggingface.co/spaces/yisol/IDM-VTON and https://huggingface.co/docs/hub/en/spaces-sdks-gradio

The official IDM-VTON Space is a Gradio app running on ZeroGPU. Its app page exposes the Space but the browser-rendered page did not expose a stable public input schema in static HTML. Hugging Face’s Gradio documentation confirms that Spaces are Gradio apps and are intended to be invoked through Gradio’s client/API conventions rather than through the generic model inference endpoint. This is a better integration direction for a custom VTON Space, but the exact endpoint names and input order must be obtained from the Space’s live API schema or from a maintained Space implementation before hard-coding a production adapter.

## Current conclusion

The present generic Hugging Face model endpoint in `server/vton.ts` is a prototype adapter, not a proven production CatVTON/IDM-VTON API contract. The app should keep the model boundary isolated, return actionable errors, and avoid claiming physical garment fit. A future production adapter should target a known Gradio Space/API with a pinned schema or a dedicated Hugging Face Inference Endpoint where the model is actually deployed.

## Verified IDM-VTON Gradio API schema

Source: https://huggingface.co/blog/gradio-vton-mcp

The official Hugging Face article shows a working `gradio_client` invocation against an IDM-VTON Space. It calls `client.predict` with `api_name: "/tryon"` and the following inputs: a `dict` containing `background`, `layers: []`, and `composite: None`; `garm_img`; `garment_des`; `is_checked`; `is_checked_crop`; `denoise_steps`; and `seed`. The article uses `handle_file` for both person and garment files and returns `output[0]`. It also notes that the original Space uses Gradio 4.x, so the wrapper queries the Space through the Gradio API client.

This gives us a documented Hugging Face-native path for IDM-VTON that is more reliable than posting an assumed JSON schema to the generic model endpoint. The app should use this adapter for the IDM-VTON path and keep CatVTON as a separately configurable path until its live Space API schema is verified.
