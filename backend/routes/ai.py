"""
AI routes - TTS, transcription, chat.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
import os
import base64

from config import logger

router = APIRouter(tags=["AI"])

# OpenAI configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')


# ============== Models ==============

class TranscriptAnalyzeRequest(BaseModel):
    transcript: str
    analysis_type: str = "summary"

class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"
    speed: float = 1.0

class AIChatMessage(BaseModel):
    role: str
    content: str

class AIChatRequest(BaseModel):
    message: str
    conversation_history: List[dict] = []
    system_prompt: Optional[str] = None


# ============== Routes ==============

@router.post("/transcripts/analyze")
async def analyze_transcript(request: TranscriptAnalyzeRequest):
    """Analyze a transcript using AI"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        from emergentintegrations.llm.openai import chat
        
        prompts = {
            "summary": "Provide a concise summary of this transcript:",
            "action_items": "Extract all action items from this transcript:",
            "key_points": "List the key points discussed in this transcript:",
            "sentiment": "Analyze the overall sentiment of this transcript:",
            "questions": "List any questions raised in this transcript:"
        }
        
        prompt = prompts.get(request.analysis_type, prompts["summary"])
        
        response = await chat(
            api_key=api_key,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes meeting transcripts."},
                {"role": "user", "content": f"{prompt}\n\n{request.transcript}"}
            ],
            model="gpt-4o"
        )
        
        return {
            "success": True,
            "analysis_type": request.analysis_type,
            "result": response
        }
    except Exception as e:
        logger.error(f"Transcript analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tts/voices")
async def get_tts_voices():
    """Get available TTS voices"""
    voices = [
        {"id": "alloy", "name": "Alloy", "description": "Neutral and balanced"},
        {"id": "echo", "name": "Echo", "description": "Male, warm"},
        {"id": "fable", "name": "Fable", "description": "British accent"},
        {"id": "onyx", "name": "Onyx", "description": "Male, deep"},
        {"id": "nova", "name": "Nova", "description": "Female, friendly"},
        {"id": "shimmer", "name": "Shimmer", "description": "Female, soft"}
    ]
    return {"voices": voices}


@router.post("/tts/generate")
async def generate_tts(request: TTSRequest):
    """Generate text-to-speech audio"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="TTS service not configured")
        
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        
        tts = OpenAITextToSpeech(api_key=api_key)
        audio_bytes = await tts.generate_speech(
            text=request.text,
            model="tts-1",
            voice=request.voice,
            speed=request.speed
        )
        
        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts/generate-base64")
async def generate_tts_base64(request: TTSRequest):
    """Generate TTS and return as base64"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="TTS service not configured")
        
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        
        tts = OpenAITextToSpeech(api_key=api_key)
        audio_bytes = await tts.generate_speech(
            text=request.text,
            model="tts-1",
            voice=request.voice,
            speed=request.speed
        )
        
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return {
            "success": True,
            "audio": audio_base64,
            "mime_type": "audio/mpeg"
        }
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/chat")
async def ai_chat(request: AIChatRequest):
    """Chat with AI assistant"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        from emergentintegrations.llm.openai import chat
        
        messages = []
        
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        else:
            messages.append({
                "role": "system",
                "content": "You are a helpful AI assistant for a meeting and collaboration platform."
            })
        
        for msg in request.conversation_history:
            messages.append(msg)
        
        messages.append({"role": "user", "content": request.message})
        
        response = await chat(
            api_key=api_key,
            messages=messages,
            model="gpt-4o"
        )
        
        return {
            "success": True,
            "response": response
        }
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/chat/stream")
async def ai_chat_stream(request: AIChatRequest):
    """Stream chat response from AI"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        from emergentintegrations.llm.openai import chat_stream
        
        messages = []
        
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        else:
            messages.append({
                "role": "system",
                "content": "You are a helpful AI assistant for a meeting and collaboration platform."
            })
        
        for msg in request.conversation_history:
            messages.append(msg)
        
        messages.append({"role": "user", "content": request.message})
        
        async def generate():
            async for chunk in chat_stream(
                api_key=api_key,
                messages=messages,
                model="gpt-4o"
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"AI chat stream error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form(default="en")
):
    """Transcribe audio file using OpenAI Whisper - uses platform API key"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Transcription service not configured")
        
        # Validate file size (25MB limit)
        contents = await file.read()
        if len(contents) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 25MB limit")
        
        # Validate file type
        valid_extensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg']
        file_ext = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_ext not in valid_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file format. Supported: {', '.join(valid_extensions)}"
            )
        
        from emergentintegrations.llm.openai import OpenAISpeechToText
        import io
        
        # Initialize STT
        stt = OpenAISpeechToText(api_key=api_key)
        
        # Create file-like object from contents
        audio_file = io.BytesIO(contents)
        audio_file.name = file.filename
        
        # Transcribe
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="verbose_json",
            language=language if language else None,
            timestamp_granularities=["segment"]
        )
        
        # Build response
        result = {
            "success": True,
            "text": response.text,
            "language": getattr(response, 'language', language),
            "duration": getattr(response, 'duration', None),
            "segments": []
        }
        
        # Add segments if available
        if hasattr(response, 'segments') and response.segments:
            result["segments"] = [
                {
                    "start": seg.start if hasattr(seg, 'start') else seg.get('start'),
                    "end": seg.end if hasattr(seg, 'end') else seg.get('end'),
                    "text": seg.text if hasattr(seg, 'text') else seg.get('text')
                }
                for seg in response.segments
            ]
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/transcribe/status")
async def get_transcription_status():
    """Check if transcription service is available (platform has API key configured)"""
    api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
    return {
        "available": bool(api_key),
        "provider": "openai_whisper"
    }
