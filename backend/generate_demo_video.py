"""Generate Munal AI demo video using Sora 2 Pro (12s, high quality)"""
import os
import sys
sys.path.insert(0, os.path.abspath('/app/backend'))
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

OUTPUT_PATH = '/app/backend/static/demo_video.mp4'
os.makedirs('/app/backend/static', exist_ok=True)

prompt = (
    "A sleek, modern SaaS product demo video. Show a polished dark-themed dashboard interface "
    "with real-time data visualizations, team video call grids, calendar scheduling views, "
    "and chat messaging panels. Smooth transitions between screens. Professional corporate "
    "aesthetic with purple and indigo accent colors on dark backgrounds. Clean typography. "
    "The camera smoothly pans across the interface showing collaboration features, "
    "shift scheduling boards, analytics charts, and approval workflows. "
    "Cinematic motion graphics style, 4K quality feel."
)

print("Starting Sora 2 Pro video generation (12s)...")
print(f"Prompt: {prompt[:80]}...")

video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
video_bytes = video_gen.text_to_video(
    prompt=prompt,
    model="sora-2-pro",
    size="1280x720",
    duration=12,
    max_wait_time=900
)

if video_bytes:
    video_gen.save_video(video_bytes, OUTPUT_PATH)
    print(f"Video saved to: {OUTPUT_PATH}")
    print(f"Size: {os.path.getsize(OUTPUT_PATH) / 1024 / 1024:.1f} MB")
else:
    print("ERROR: Video generation failed")
