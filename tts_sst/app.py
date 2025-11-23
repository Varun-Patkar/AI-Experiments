from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from faster_whisper import WhisperModel
from io import BytesIO
import tempfile
import base64
import uvicorn
from pydub import AudioSegment
import numpy as np
import os
from pathlib import Path

# ---------- Kokoro imports ----------
# pip install kokoro>=0.9.4 soundfile
from kokoro import KPipeline
import soundfile as sf

app = FastAPI(
    title="Whisper + Kokoro Speech Server",
    description="Speech-to-Text and Text-to-Speech in one FastAPI app",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins, or specify ["http://localhost:8080"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load models on startup ----------
print("🔄 Loading Whisper model...")
whisper = WhisperModel("small", device="cpu")  # CPU-only

print("🔄 Loading Kokoro model...")
pipeline = KPipeline(lang_code='a')  # 'a' for English

# Create output directory for generated audio files
OUTPUT_DIR = Path("generated_audio")
OUTPUT_DIR.mkdir(exist_ok=True)

# ---------- Speech → Text ----------
@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    if file.content_type not in ["audio/wav", "audio/mp3", "audio/webm", "audio/mpeg", "audio/ogg"]:
        raise HTTPException(400, "Unsupported audio format")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp.flush()
        tmp_path = tmp.name
    
    try:
        segments, info = whisper.transcribe(tmp_path)
        segments_list = list(segments)
        text = "".join(seg.text for seg in segments_list)
    finally:
        import os
        os.unlink(tmp_path)

    return {"text": text.strip(), "language": info.language}

# ---------- Text → Speech ----------
@app.post("/tts")
async def tts(request: Request):
    """
    Generate speech from text using Kokoro TTS.
    
    Request Body:
        text: The text to convert to speech
        voice: Voice to use (default: af_heart)
        format: Output format - 'mp3' or 'wav' (default: mp3)
    
    Returns:
        JSON with base64-encoded audio
    """
    body = await request.json()
    text = body.get("text", "")
    voice = body.get("voice", "af_heart")
    output_format = body.get("format", "mp3")
    
    if not text:
        raise HTTPException(400, "Text parameter is required")
    
    try:
        generator = pipeline(text, voice=voice)
        audio_segments = []
        
        # Collect all audio segments
        for i, (gs, ps, audio) in enumerate(generator):
            audio_segments.append(audio)
        
        # Combine all segments into one array
        combined_audio = np.concatenate(audio_segments)
        
        # Save as temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
            sf.write(tmp_wav.name, combined_audio, 24000)
            tmp_wav_path = tmp_wav.name
        
        try:
            # Convert to requested format
            audio = AudioSegment.from_wav(tmp_wav_path)
            
            with tempfile.NamedTemporaryFile(suffix=f".{output_format}", delete=False) as tmp_out:
                if output_format == "mp3":
                    audio.export(tmp_out.name, format="mp3", bitrate="128k")
                else:
                    audio.export(tmp_out.name, format="wav")
                
                tmp_out_path = tmp_out.name
            
            # Read and encode to base64
            with open(tmp_out_path, "rb") as f:
                audio_data = f.read()
                audio_base64 = base64.b64encode(audio_data).decode("utf-8")
            
            return {
                "status": "success",
                "audio_base64": audio_base64,
                "format": output_format
            }
        finally:
            # Clean up temporary files
            os.unlink(tmp_wav_path)
            if 'tmp_out_path' in locals():
                os.unlink(tmp_out_path)
                
    except Exception as e:
        raise HTTPException(500, f"TTS generation failed: {str(e)}")

# ---------- Health check ----------
@app.get("/")
def root():
    return {"status": "ok", "whisper": True, "kokoro": True}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=9000)
