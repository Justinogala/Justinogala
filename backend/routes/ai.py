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


# ============== Video Generation (Sora 2) ==============

import asyncio
from concurrent.futures import ThreadPoolExecutor

# Store for video generation jobs
video_jobs = {}
video_executor = ThreadPoolExecutor(max_workers=2)

class VideoGenerationRequest(BaseModel):
    prompt: str
    size: str = "1280x720"  # 1280x720, 1792x1024, 1024x1792, 1024x1024
    duration: int = 12  # Base: 4, 8, 12. Extended: 24, 36, 48, 60 (multi-clip)
    model: str = "sora-2"  # sora-2 or sora-2-pro


def generate_video_sync(job_id: str, prompt: str, model: str, size: str, duration: int, api_key: str):
    """Synchronous video generation (runs in thread pool)"""
    try:
        from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
        
        video_jobs[job_id] = {"status": "generating", "progress": 10}
        
        video_gen = OpenAIVideoGeneration(api_key=api_key)
        
        base_durations = [4, 8, 12]
        extended_durations = [24, 36, 48, 60]
        
        if duration in extended_durations:
            num_clips = duration // 12
            clip_duration = 12
            clip_paths = []
            
            for i in range(num_clips):
                video_jobs[job_id] = {
                    "status": "generating", 
                    "progress": 10 + (i * 80 // num_clips),
                    "message": f"Generating clip {i+1}/{num_clips}..."
                }
                
                clip_prompt = f"Continuation of scene: {prompt}" if i > 0 else prompt
                clip_bytes = video_gen.text_to_video(
                    prompt=clip_prompt,
                    model=model,
                    size=size,
                    duration=clip_duration,
                    max_wait_time=600
                )
                
                if not clip_bytes:
                    video_jobs[job_id] = {"status": "failed", "error": f"Failed to generate clip {i+1}"}
                    return
                
                clip_path = f"/tmp/clip_{job_id}_{i}.mp4"
                video_gen.save_video(clip_bytes, clip_path)
                clip_paths.append(clip_path)
            
            # Stitch clips
            video_jobs[job_id] = {"status": "generating", "progress": 90, "message": "Stitching clips..."}
            output_path = f"/tmp/video_{job_id}.mp4"
            
            if not stitch_videos_with_ffmpeg(clip_paths, output_path):
                video_jobs[job_id] = {"status": "failed", "error": "Failed to stitch clips"}
                return
            
            with open(output_path, 'rb') as f:
                video_bytes = f.read()
            import os
            os.remove(output_path)
        else:
            video_jobs[job_id] = {"status": "generating", "progress": 30, "message": "Generating video..."}
            video_bytes = video_gen.text_to_video(
                prompt=prompt,
                model=model,
                size=size,
                duration=duration,
                max_wait_time=600
            )
        
        if not video_bytes:
            video_jobs[job_id] = {"status": "failed", "error": "No video returned"}
            return
        
        # Save result
        video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        video_jobs[job_id] = {
            "status": "completed",
            "progress": 100,
            "video_base64": video_base64,
            "size": size,
            "duration": duration,
            "file_size": len(video_bytes)
        }
        logger.info(f"Video job {job_id} completed: {len(video_bytes)} bytes")
        
    except Exception as e:
        logger.error(f"Video job {job_id} failed: {e}")
        video_jobs[job_id] = {"status": "failed", "error": str(e)}


def stitch_videos_with_ffmpeg(video_paths: list, output_path: str) -> bool:
    """Stitch multiple videos together using ffmpeg"""
    import subprocess
    import os
    
    # Create a file list for ffmpeg concat
    list_file = f"/tmp/video_list_{os.path.basename(output_path)}.txt"
    with open(list_file, 'w') as f:
        for path in video_paths:
            f.write(f"file '{path}'\n")
    
    try:
        # Use ffmpeg concat demuxer for seamless stitching
        cmd = [
            'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
            '-i', list_file,
            '-c', 'copy',  # Copy without re-encoding for speed
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        
        # Cleanup temp files
        os.remove(list_file)
        for path in video_paths:
            if os.path.exists(path):
                os.remove(path)
        
        return result.returncode == 0
    except Exception as e:
        logger.error(f"FFmpeg stitching error: {e}")
        return False


@router.post("/ai/video/generate")
async def generate_video(request: VideoGenerationRequest):
    """Generate video from text prompt using Sora 2. Supports extended durations via multi-clip stitching."""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Video generation service not configured")
        
        # Validate parameters
        valid_sizes = ["1280x720", "1792x1024", "1024x1792", "1024x1024"]
        base_durations = [4, 8, 12]
        extended_durations = [24, 36, 48, 60]  # Multi-clip durations
        all_valid_durations = base_durations + extended_durations
        valid_models = ["sora-2", "sora-2-pro"]
        
        if request.size not in valid_sizes:
            raise HTTPException(status_code=400, detail=f"Invalid size. Must be one of: {valid_sizes}")
        if request.duration not in all_valid_durations:
            raise HTTPException(status_code=400, detail=f"Invalid duration. Must be one of: {all_valid_durations}")
        if request.model not in valid_models:
            raise HTTPException(status_code=400, detail=f"Invalid model. Must be one of: {valid_models}")
        
        from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
        import uuid
        import os
        
        video_id = str(uuid.uuid4())
        video_gen = OpenAIVideoGeneration(api_key=api_key)
        
        # Check if extended duration (requires multi-clip)
        if request.duration in extended_durations:
            # Calculate number of 12-second clips needed
            num_clips = request.duration // 12
            clip_duration = 12
            
            logger.info(f"Extended video: generating {num_clips} clips of {clip_duration}s each for {request.duration}s total")
            
            clip_paths = []
            for i in range(num_clips):
                logger.info(f"Generating clip {i+1}/{num_clips}...")
                
                clip_bytes = await generate_single_clip(
                    video_gen, request.prompt, request.model, 
                    request.size, clip_duration, clip_num=i+1
                )
                
                if not clip_bytes:
                    raise HTTPException(status_code=500, detail=f"Failed to generate clip {i+1}")
                
                # Save clip temporarily
                clip_path = f"/tmp/clip_{video_id}_{i}.mp4"
                video_gen.save_video(clip_bytes, clip_path)
                clip_paths.append(clip_path)
            
            # Stitch clips together
            output_path = f"/tmp/video_{video_id}.mp4"
            logger.info(f"Stitching {num_clips} clips together...")
            
            if not stitch_videos_with_ffmpeg(clip_paths, output_path):
                raise HTTPException(status_code=500, detail="Failed to stitch video clips together")
            
            # Read final video
            with open(output_path, 'rb') as f:
                video_bytes = f.read()
            os.remove(output_path)
            
        else:
            # Single clip generation
            logger.info(f"Single clip: prompt='{request.prompt[:50]}...', size={request.size}, duration={request.duration}s")
            
            video_bytes = video_gen.text_to_video(
                prompt=request.prompt,
                model=request.model,
                size=request.size,
                duration=request.duration,
                max_wait_time=600
            )
            
            if not video_bytes:
                raise HTTPException(status_code=500, detail="Video generation failed - no video returned")
        
        # Convert to base64 for response
        video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        
        logger.info(f"Video generation complete: {len(video_bytes)} bytes, duration={request.duration}s")
        
        return {
            "success": True,
            "video_id": video_id,
            "video_base64": video_base64,
            "size": request.size,
            "duration": request.duration,
            "mime_type": "video/mp4",
            "is_extended": request.duration in extended_durations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/video/status")
async def get_video_generation_status():
    """Check if video generation service is available"""
    api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
    return {
        "available": bool(api_key),
        "provider": "sora-2",
        "supported_sizes": ["1280x720", "1792x1024", "1024x1792", "1024x1024"],
        "supported_durations": {
            "base": [4, 8, 12],
            "extended": [24, 36, 48, 60]
        },
        "supported_models": ["sora-2", "sora-2-pro"]
    }
