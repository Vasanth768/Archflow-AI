from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import base64
import os
import io

app = FastAPI()

HF_TOKEN = os.getenv("HF_API_TOKEN", os.getenv("QWEN_IMAGE_API_KEY", ""))
HF_MODEL = os.getenv("HF_IMAGE_MODEL", "stabilityai/stable-diffusion-2-1")

print(f"[AI-Service] Starting with model: {HF_MODEL}")
print(f"[HF_CONFIG] token_present={str(bool(HF_TOKEN)).lower()}")
print(f"[HF_CONFIG] token_length={len(HF_TOKEN) if HF_TOKEN else 0}")
print(f"[HF_CONFIG] model={HF_MODEL}")
print(f"[HF_CONFIG] endpoint=Hugging Face Standard Inference")

class GenerateRequest(BaseModel):
    prompt: str
    parameters: Optional[Dict[str, Any]] = None

class ValidationRequest(BaseModel):
    image_b64: str
    buildingType: str

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "service": "ai-service",
        "model": HF_MODEL,
        "token_configured": bool(HF_TOKEN)
    }

@app.post("/generate")
def generate_image(req: GenerateRequest):
    print(f"[AI-Service] Received generation request. Prompt length: {len(req.prompt)}")

    if not HF_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="HF_API_TOKEN / QWEN_IMAGE_API_KEY is not configured in the ai-service environment."
        )

    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(token=HF_TOKEN)

        print(f"[AI-Service] Calling HF standard inference for model: {HF_MODEL}")
        print(f"[AI-Service] NOTE: Using standard HF inference (free tier), NOT paid nscale/Inference Providers")

        # Use a shorter prompt to avoid issues (truncate at 300 chars for API)
        prompt = req.prompt[:300]

        image = client.text_to_image(
            prompt=prompt,
            model=HF_MODEL,
        )

        # Convert PIL image to base64 JPEG
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        print(f"[AI-Service] Generation successful. Image size: {len(img_b64)} bytes (base64)")
        return {"images": [img_b64]}

    except Exception as e:
        err_msg = str(e)
        print(f"[AI-Service] Generation failed: {err_msg}")
        # Provide a clean error message without revealing the token
        if "401" in err_msg or "Unauthorized" in err_msg:
            raise HTTPException(status_code=401, detail="HF token is invalid or expired.")
        elif "402" in err_msg or "payment" in err_msg.lower() or "credit" in err_msg.lower():
            raise HTTPException(status_code=402, detail="This model requires paid credits. Switch to a free model in HF_IMAGE_MODEL.")
        elif "503" in err_msg or "loading" in err_msg.lower():
            raise HTTPException(status_code=503, detail="Model is loading. Please retry in 20-30 seconds.")
        elif "429" in err_msg or "rate" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Rate limit reached. Please wait and retry.")
        else:
            raise HTTPException(status_code=500, detail=f"Image generation failed: {err_msg[:200]}")

@app.post("/validate")
def validate_image(req: ValidationRequest):
    print(f"[AI-Service] Received validation request for buildingType: {req.buildingType}")
    
    if req.buildingType != "single_floor":
        return {
            "status": "UNVERIFIED",
            "reason": f"Validation not implemented for buildingType: {req.buildingType}"
        }

    if not HF_TOKEN:
        print("[AI-Service] Validation failed: HF_API_TOKEN not configured")
        return {
            "status": "UNVERIFIED",
            "reason": "HF_API_TOKEN not configured"
        }

    # Attempt to use Qwen2-VL or Llama Vision via Hugging Face Router
    # Since we know free tier often rejects this with 400 unsupported-provider, 
    # we will handle it gracefully and return UNVERIFIED.
    API_URL = "https://router.huggingface.co/hf-inference/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    
    prompt_text = (
        "Answer strictly YES or NO: Does this image show a building with exactly one single ground floor and absolutely no upper floors, no upper windows, and no stairs to a higher level?"
    )

    payload = {
        "model": "Qwen/Qwen-VL-Chat", # Can also be "meta-llama/Llama-3.2-11B-Vision-Instruct"
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{req.image_b64}"}}
                ]
            }
        ],
        "max_tokens": 100,
        "stream": False
    }

    try:
        import requests
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=15)
        
        if resp.status_code != 200:
            error_text = resp.text
            print(f"[AI-Service] VLM API returned {resp.status_code}: {error_text}")
            return {
                "status": "UNVERIFIED",
                "reason": f"VLM API Error {resp.status_code}: {error_text[:100]}"
            }
            
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        
        print(f"[AI-Service] VLM API returned success! Output: {content}")
        
        content_lower = content.strip().lower()
        if "yes" in content_lower and "no" not in content_lower:
            return {
                "status": "VALID",
                "reason": "VLM confirmed single floor",
                "raw_vqa_output": content
            }
        elif "no" in content_lower:
            return {
                "status": "INVALID",
                "reason": "VLM detected multiple floors",
                "raw_vqa_output": content
            }
            
        return {
            "status": "UNVERIFIED",
            "reason": "VLM response indeterminate",
            "raw_vqa_output": content
        }
        
    except Exception as e:
        print(f"[AI-Service] VLM API Exception: {str(e)}")
        return {
            "status": "UNVERIFIED",
            "reason": f"VLM Exception: {str(e)}"
        }

