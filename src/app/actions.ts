'use server'

export async function getToken() {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-realtime-preview-2024-12-17",
            voice: "verse",
            "input_audio_transcription": {
                "model": "whisper-1"
            },
        }),
    });
    const res = await r.json();

    return res
}