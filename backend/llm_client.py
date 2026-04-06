"""
Lightweight OpenAI SDK wrapper replacing emergentintegrations + litellm.
Uses the Emergent proxy at https://integrations.emergentagent.com/llm
with the Emergent Universal Key for all LLM operations.
"""
import os
from openai import OpenAI

PROXY_BASE_URL = "https://integrations.emergentagent.com/llm"


def get_client(api_key: str = None) -> OpenAI:
    key = api_key or os.environ.get("EMERGENT_API_KEY", "")
    return OpenAI(api_key=key, base_url=PROXY_BASE_URL)


def chat_completion(messages: list, model: str = "gpt-5.2", api_key: str = None, stream: bool = False, **kwargs):
    client = get_client(api_key)
    return client.chat.completions.create(model=model, messages=messages, stream=stream, **kwargs)


def speech_to_text(audio_file, api_key: str = None, model: str = "whisper-1"):
    client = get_client(api_key)
    return client.audio.transcriptions.create(model=model, file=audio_file)


def text_to_speech(text: str, voice: str = "alloy", model: str = "tts-1", api_key: str = None):
    client = get_client(api_key)
    return client.audio.speech.create(model=model, voice=voice, input=text)
