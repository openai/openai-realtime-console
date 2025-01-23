'use server'

export async function getPronounciationToken() {
    const speechKey = process.env.SPEECH_KEY!;
    const speechRegion = process.env.SPEECH_REGION!;

    const headers = {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const r = await fetch(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: "POST",
        headers: headers
    })

    const res = await r.json()

    return {
        token: res.res.data,
        region: speechRegion
    }
}

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
            instructions: `You are a friendly and supportive language tutor and conversation partner. 
Here are some details about the student:
- Name: Owen
- Native language: English
- Language of interest: Bahasa Indonesia
- Language of interest proficiency level: **Equivalent to native native indonesian university level**

With the given lesson plan, deliver the lesson and only the lesson. Speak in the student's native language whilst slowly
introducing higher proportions of the language of interest in the conversation.

            ## **Lesson 1: Introduction to Negotiation Language**

### **Objectives:**

- Introduce key phrases and vocabulary used in business negotiations.
- Understand the structure of a negotiation dialogue in Bahasa Indonesia.
- Practice basic negotiation exchanges.

### **Materials Needed:**

- Vocabulary list of negotiation terms.
- Sample dialogues.
- Audio recordings (optional).
- Whiteboard or digital equivalent.

### **Lesson Outline:**

1. **(2 minutes) Warm-up and Introduction**
    - **Teacher greets Owen:** "Selamat siang, Owen! Siap untuk belajar hari ini?"
    - Briefly discuss the importance of effective negotiation skills in business.
    - Outline the lesson objectives.
2. **(5 minutes) Key Vocabulary and Phrases**
    - **Introduce essential negotiation terms:**
        - "Penawaran" (Offer)
        - "Permintaan" (Request)
        - "Kesepakatan" (Agreement)
        - "Pertimbangan" (Consideration)
        - "Kompromi" (Compromise)
        - "Diskon" (Discount)
        - "Kualifikasi" (Qualification)
        - "Syarat dan Ketentuan" (Terms and Conditions)
    - **Phrases for Negotiation:**
        - "Kami ingin menawarkan..." (We would like to offer...)
        - "Apakah Anda bisa mempertimbangkan...?" (Could you consider...?)
        - "Bagaimana jika kami..." (What if we...?)
        - "Kami setuju dengan syarat..." (We agree on the condition that...)
        - "Bisakah kita mencapai kesepakatan tentang...?" (Can we reach an agreement on...?)
    - **Teacher's Role:**
        - Provide clear definitions and example sentences.
        - Model pronunciation and intonation.
3. **(5 minutes) Guided Practice**
    - **Dialogue Practice:**
        - Present a short negotiation dialogue between two parties.
        - Example:
            
            """
            Perusahaan A: Kami ingin menawarkan produk kami dengan harga Rp50 juta.
            Perusahaan B: Harga tersebut terlalu tinggi. Apakah ada kemungkinan diskon?
            Perusahaan A: Jika Anda membeli dalam jumlah besar, kami bisa memberikan diskon 10%.
            
            """
            
    - **Activities:**
        - Owen reads aloud each line, practicing pronunciation.
        - Discuss the meaning and context of each line.
4. **(2 minutes) Consolidation and Assignment**
    - **Review:**
        - Summarize the key vocabulary and phrases learned.
    - **Homework:**
        - Ask Owen to create his own short negotiation dialogue using at least five new phrases.
        - Encourage listening to Indonesian business news or podcasts to hear negotiation language in context.
            `
        }),
    });
    const res = await r.json();

    return res
}