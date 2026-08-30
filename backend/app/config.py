import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True, parents=True)

SAMPLES_DIR = BASE_DIR / "app" / "samples"
SAMPLES_DIR.mkdir(exist_ok=True, parents=True)

DB_PATH = BASE_DIR / "procurelens.db"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

DEFAULT_WEIGHTS = {
    "weight_tco": 35,
    "weight_technical": 25,
    "weight_compliance": 20,
    "weight_risk": 10,
    "weight_sla": 10,
}
