"""
AI routes - TTS, transcription, chat, video generation.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import os
import base64

from config import logger, db

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


# ============== Recording Transcription ==============

import uuid
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

class RecordingTranscriptionRequest(BaseModel):
    file_id: str
    user_id: str
    file_name: str

@router.post("/ai/transcribe/recording")
async def transcribe_recording(request: RecordingTranscriptionRequest):
    """Transcribe a stored recording from GridFS"""
    try:
        api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Transcription service not configured")
        
        # Get the file from GridFS
        fs = AsyncIOMotorGridFSBucket(db, bucket_name="chat_files")
        
        # Find the file metadata
        file_doc = await db.chat_files.find_one({"id": request.file_id})
        if not file_doc:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        grid_id = file_doc.get("grid_id")
        if not grid_id:
            raise HTTPException(status_code=404, detail="Recording file not found in storage")
        
        from bson import ObjectId
        import io
        import tempfile
        import subprocess
        import os
        
        # Download the file from GridFS
        file_data = io.BytesIO()
        await fs.download_to_stream(ObjectId(grid_id), file_data)
        file_data.seek(0)
        
        # Check file size (25MB limit for Whisper)
        file_size = file_data.getbuffer().nbytes
        audio_file = file_data
        temp_files = []
        
        if file_size > 25 * 1024 * 1024:
            # Large file - extract audio using ffmpeg
            logger.info(f"Large file detected ({file_size / (1024*1024):.1f}MB), extracting audio with ffmpeg")
            
            try:
                # Save video to temp file
                with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as video_temp:
                    video_temp.write(file_data.read())
                    video_temp_path = video_temp.name
                    temp_files.append(video_temp_path)
                
                # Create temp file for audio output
                audio_temp_fd, audio_temp_path = tempfile.mkstemp(suffix='.mp3')
                os.close(audio_temp_fd)
                temp_files.append(audio_temp_path)
                
                # Extract audio using ffmpeg (compress to mp3 at lower bitrate)
                ffmpeg_cmd = [
                    'ffmpeg', '-y',
                    '-i', video_temp_path,
                    '-vn',  # No video
                    '-acodec', 'libmp3lame',
                    '-ab', '64k',  # Lower bitrate for smaller file
                    '-ar', '16000',  # 16kHz sample rate (good for speech)
                    '-ac', '1',  # Mono
                    audio_temp_path
                ]
                
                result = subprocess.run(
                    ffmpeg_cmd, 
                    capture_output=True, 
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                if result.returncode != 0:
                    logger.error(f"FFmpeg error: {result.stderr}")
                    raise Exception(f"Audio extraction failed: {result.stderr[:200]}")
                
                # Check extracted audio size
                extracted_size = os.path.getsize(audio_temp_path)
                logger.info(f"Extracted audio size: {extracted_size / (1024*1024):.1f}MB")
                
                if extracted_size > 25 * 1024 * 1024:
                    raise HTTPException(
                        status_code=400,
                        detail="Recording audio too long for transcription. Please split into shorter segments."
                    )
                
                # Read the extracted audio
                audio_file = io.BytesIO()
                with open(audio_temp_path, 'rb') as f:
                    audio_file.write(f.read())
                audio_file.seek(0)
                audio_file.name = 'audio.mp3'
                
            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=500, detail="Audio extraction timed out")
            except Exception as e:
                logger.error(f"FFmpeg extraction error: {e}")
                raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")
            finally:
                # Cleanup temp files
                for temp_path in temp_files:
                    try:
                        if os.path.exists(temp_path):
                            os.unlink(temp_path)
                    except Exception:
                        pass
        else:
            # Prepare file for transcription
            audio_file.name = request.file_name or "recording.webm"
        
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        # Initialize STT
        stt = OpenAISpeechToText(api_key=api_key)
        
        # Transcribe
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="verbose_json",
            language="en",
            timestamp_granularities=["segment"]
        )
        
        # Build transcript data
        transcript_id = str(uuid.uuid4())
        segments = []
        
        if hasattr(response, 'segments') and response.segments:
            segments = [
                {
                    "start": seg.start if hasattr(seg, 'start') else seg.get('start'),
                    "end": seg.end if hasattr(seg, 'end') else seg.get('end'),
                    "text": seg.text if hasattr(seg, 'text') else seg.get('text')
                }
                for seg in response.segments
            ]
        
        # Store transcript in database
        transcript_doc = {
            "id": transcript_id,
            "file_id": request.file_id,
            "user_id": request.user_id,
            "file_name": request.file_name,
            "text": response.text,
            "language": getattr(response, 'language', 'en'),
            "duration": getattr(response, 'duration', None),
            "segments": segments,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "completed"
        }
        
        await db.recording_transcripts.insert_one(transcript_doc)
        
        # Update the file record with transcript reference
        await db.chat_files.update_one(
            {"id": request.file_id},
            {"$set": {"transcript_id": transcript_id, "has_transcript": True}}
        )
        
        return {
            "success": True,
            "transcript_id": transcript_id,
            "text": response.text,
            "duration": getattr(response, 'duration', None),
            "segments": segments
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recording transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/transcribe/recording/{file_id}")
async def get_recording_transcript(file_id: str):
    """Get transcript for a recording"""
    try:
        transcript = await db.recording_transcripts.find_one(
            {"file_id": file_id},
            {"_id": 0}
        )
        
        if not transcript:
            return {"success": False, "message": "No transcript found for this recording"}
        
        return {"success": True, "transcript": transcript}
        
    except Exception as e:
        logger.error(f"Get transcript error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/transcripts/user/{user_id}")
async def get_user_transcripts(user_id: str, limit: int = 50):
    """Get all transcripts for a user"""
    try:
        transcripts = await db.recording_transcripts.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {"success": True, "transcripts": transcripts, "count": len(transcripts)}
        
    except Exception as e:
        logger.error(f"Get user transcripts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/ai/transcripts/{transcript_id}")
async def delete_transcript(transcript_id: str):
    """Delete a transcript"""
    try:
        result = await db.recording_transcripts.delete_one({"id": transcript_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        return {"success": True, "message": "Transcript deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete transcript error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


async def get_video_api_key():
    """Get the video generation API key from admin settings or fallback to env"""
    # First try admin-configured key from database
    settings = await db.admin_settings.find_one({"category": "video_api"})
    if settings and settings.get("api_key"):
        return settings["api_key"]
    
    # Fallback to environment variables
    return EMERGENT_LLM_KEY or OPENAI_API_KEY


def generate_video_sync(job_id: str, prompt: str, model: str, size: str, duration: int, api_key: str):
    """Synchronous video generation using OpenAI API directly (runs in thread pool)"""
    import requests
    import time
    
    try:
        video_jobs[job_id] = {"status": "generating", "progress": 10, "message": "Starting video generation..."}
        
        base_durations = [4, 8, 12]
        extended_durations = [24, 36, 48, 60]
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        def create_video_job(prompt_text, dur):
            """Create a video generation job with OpenAI API"""
            response = requests.post(
                'https://api.openai.com/v1/videos',
                headers=headers,
                json={
                    'model': model,
                    'prompt': prompt_text,
                    'seconds': str(dur),
                    'size': size
                },
                timeout=60
            )
            if response.status_code not in [200, 201]:
                raise Exception(f"API error: {response.text}")
            return response.json()
        
        def poll_video_job(video_id, max_wait=600):
            """Poll for video job completion"""
            start_time = time.time()
            while time.time() - start_time < max_wait:
                response = requests.get(
                    f'https://api.openai.com/v1/videos/{video_id}',
                    headers=headers,
                    timeout=30
                )
                if response.status_code != 200:
                    raise Exception(f"Poll error: {response.text}")
                
                data = response.json()
                status = data.get('status')
                progress = data.get('progress', 0)
                
                if status == 'completed':
                    return data
                elif status == 'failed':
                    raise Exception(f"Video generation failed: {data.get('error', 'Unknown error')}")
                
                time.sleep(5)
            
            raise Exception("Video generation timed out")
        
        def download_video(video_id):
            """Download the generated video"""
            response = requests.get(
                f'https://api.openai.com/v1/videos/{video_id}/content',
                headers=headers,
                timeout=120
            )
            if response.status_code != 200:
                raise Exception(f"Download error: {response.text}")
            return response.content
        
        if duration in extended_durations:
            # Extended duration - generate multiple clips and stitch
            num_clips = duration // 12
            clip_duration = 12
            clip_paths = []
            
            for i in range(num_clips):
                video_jobs[job_id] = {
                    "status": "generating", 
                    "progress": 10 + (i * 70 // num_clips),
                    "message": f"Generating clip {i+1}/{num_clips}..."
                }
                
                clip_prompt = f"Continuation of scene: {prompt}" if i > 0 else prompt
                
                # Create job
                job_data = create_video_job(clip_prompt, clip_duration)
                video_id = job_data['id']
                
                # Poll for completion
                completed_data = poll_video_job(video_id)
                
                # Download video
                clip_bytes = download_video(video_id)
                
                if not clip_bytes:
                    video_jobs[job_id] = {"status": "failed", "error": f"Failed to download clip {i+1}"}
                    return
                
                clip_path = f"/tmp/clip_{job_id}_{i}.mp4"
                with open(clip_path, 'wb') as f:
                    f.write(clip_bytes)
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
            for cp in clip_paths:
                try:
                    os.remove(cp)
                except:
                    pass
        else:
            # Standard duration
            video_jobs[job_id] = {"status": "generating", "progress": 20, "message": "Creating video job..."}
            
            # Create job
            job_data = create_video_job(prompt, duration)
            video_id = job_data['id']
            
            video_jobs[job_id] = {"status": "generating", "progress": 30, "message": "Generating video..."}
            
            # Poll for completion
            completed_data = poll_video_job(video_id)
            
            video_jobs[job_id] = {"status": "generating", "progress": 80, "message": "Downloading video..."}
            
            # Download video
            video_bytes = download_video(video_id)
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
    """Start async video generation job. Returns job_id immediately for polling."""
    try:
        # Get API key from admin settings or fallback to env
        api_key = await get_video_api_key()
        
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="Video generation not configured. Please contact administrator."
            )
        
        # Validate parameters
        valid_sizes = ["1280x720", "1792x1024", "1024x1792", "1024x1024"]
        base_durations = [4, 8, 12]
        extended_durations = [24, 36, 48, 60]
        all_valid_durations = base_durations + extended_durations
        valid_models = ["sora-2", "sora-2-pro"]
        
        if request.size not in valid_sizes:
            raise HTTPException(status_code=400, detail=f"Invalid size. Must be one of: {valid_sizes}")
        if request.duration not in all_valid_durations:
            raise HTTPException(status_code=400, detail=f"Invalid duration. Must be one of: {all_valid_durations}")
        if request.model not in valid_models:
            raise HTTPException(status_code=400, detail=f"Invalid model. Must be one of: {valid_models}")
        
        import uuid
        job_id = str(uuid.uuid4())
        
        # Initialize job status
        video_jobs[job_id] = {"status": "queued", "progress": 0}
        
        # Start generation in background thread
        video_executor.submit(
            generate_video_sync,
            job_id,
            request.prompt,
            request.model,
            request.size,
            request.duration,
            api_key
        )
        
        logger.info(f"Video job {job_id} started: prompt='{request.prompt[:50]}...', duration={request.duration}s")
        
        return {
            "success": True,
            "job_id": job_id,
            "status": "queued",
            "message": "Video generation started. Poll /api/ai/video/job/{job_id} for status."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/video/job/{job_id}")
async def get_video_job_status(job_id: str):
    """Poll video generation job status"""
    if job_id not in video_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = video_jobs[job_id]
    
    # If completed, include the video data
    if job.get("status") == "completed":
        return {
            "success": True,
            "status": "completed",
            "progress": 100,
            "video_base64": job.get("video_base64"),
            "size": job.get("size"),
            "duration": job.get("duration"),
            "file_size": job.get("file_size"),
            "mime_type": "video/mp4"
        }
    elif job.get("status") == "failed":
        return {
            "success": False,
            "status": "failed",
            "error": job.get("error", "Unknown error")
        }
    else:
        return {
            "success": True,
            "status": job.get("status", "processing"),
            "progress": job.get("progress", 0),
            "message": job.get("message", "Generating video...")
        }


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


# ============== Video History ==============

class SaveVideoRequest(BaseModel):
    video_base64: str
    prompt: str
    duration: int
    size: str
    title: Optional[str] = None


@router.post("/ai/video/history")
async def save_video_to_history(request: SaveVideoRequest):
    """Save generated video to user's history"""
    try:
        # Calculate file size from base64
        video_bytes = base64.b64decode(request.video_base64)
        file_size = len(video_bytes)
        
        video_doc = {
            "title": request.title or f"Video - {request.duration}s",
            "prompt": request.prompt,
            "duration": request.duration,
            "size": request.size,
            "file_size": file_size,
            "video_base64": request.video_base64,
            "created_at": datetime.now(timezone.utc),
            "mime_type": "video/mp4"
        }
        
        result = await db.video_history.insert_one(video_doc)
        
        return {
            "success": True,
            "video_id": str(result.inserted_id),
            "message": "Video saved to history"
        }
    except Exception as e:
        logger.error(f"Error saving video to history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/video/history")
async def get_video_history(limit: int = 20, skip: int = 0):
    """Get user's video history (without video data for listing)"""
    try:
        # Get videos without the large base64 data
        cursor = db.video_history.find(
            {},
            {"video_base64": 0}  # Exclude large video data
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        videos = []
        async for doc in cursor:
            videos.append({
                "id": str(doc["_id"]),
                "title": doc.get("title", "Untitled"),
                "prompt": doc.get("prompt", ""),
                "duration": doc.get("duration"),
                "size": doc.get("size"),
                "file_size": doc.get("file_size"),
                "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None
            })
        
        total = await db.video_history.count_documents({})
        
        return {
            "videos": videos,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error fetching video history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/video/history/{video_id}")
async def get_video_from_history(video_id: str):
    """Get a specific video from history (includes video data)"""
    try:
        from bson import ObjectId
        
        doc = await db.video_history.find_one({"_id": ObjectId(video_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "id": str(doc["_id"]),
            "title": doc.get("title", "Untitled"),
            "prompt": doc.get("prompt", ""),
            "duration": doc.get("duration"),
            "size": doc.get("size"),
            "file_size": doc.get("file_size"),
            "video_base64": doc.get("video_base64"),
            "mime_type": doc.get("mime_type", "video/mp4"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/ai/video/history/{video_id}")
async def delete_video_from_history(video_id: str):
    """Delete a video from history"""
    try:
        from bson import ObjectId
        
        result = await db.video_history.delete_one({"_id": ObjectId(video_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {"success": True, "message": "Video deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting video: {e}")
        raise HTTPException(status_code=500, detail=str(e))
