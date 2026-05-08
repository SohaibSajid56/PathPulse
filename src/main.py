from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
import re

# If your file is named api.env, load it explicitly.
# If you rename it to .env, change this to load_dotenv() or load_dotenv(".env")
load_dotenv("api.env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing. Check api.env")

client = Groq(api_key=GROQ_API_KEY)

# Fast + efficient option:
MODEL = "llama-3.1-8b-instant"
# If you want stronger output quality, switch to:
# MODEL = "llama-3.3-70b-versatile"


class RoleRequest(BaseModel):
    role: str


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    role: str


@app.get("/")
async def root():
    return {"status": "PathPulse API (Groq) running ✓"}


@app.post("/get-question")
async def get_question(request: RoleRequest):
    try:
        prompt = (
            f"Generate ONE challenging, scenario-based technical interview question "
            f"for a {request.role} role. Return ONLY the question text."
        )

        res = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

        question = res.choices[0].message.content.strip()
        return {"question": question}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate")
async def evaluate_answer(request: EvaluateRequest):
    try:
        prompt = f"""
You are a senior {request.role} interviewer.

Evaluate this answer strictly but fairly.

Question: {request.question}
Answer: {request.answer}

Return EXACTLY this format:

Score: X/100
Strengths:
✓ ...
✓ ...

Gaps:
✗ ...
✗ ...

Improve:
→ ...
→ ...
"""

        res = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        raw = res.choices[0].message.content.strip()

        match = re.search(r"Score:\s*(\d+)", raw)
        score = int(match.group(1)) if match else 65

        return {"feedback": raw, "score": score}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)