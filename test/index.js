const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const audioconcat = require('audioconcat'); // For merging audio files

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (['audio/mpeg', 'audio/wave', 'audio/wav', 'audio/x-wav'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP3 and WAV files are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });

const API_KEY = '0ced95ba-6c6b-44aa-ad0e-afc589ff0102';
const TRANSCRIBE_API_URL = 'https://api.sarvam.ai/speech-to-text-translate';
const TRANSLATE_API_URL = 'https://api.sarvam.ai/translate';
const TTS_API_URL = 'https://api.sarvam.ai/text-to-speech';

// Ensure the directory exists
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

app.post('/transcribe_with_node', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path));

    const transcribeOptions = {
        method: 'POST',
        headers: { 'api-subscription-key': API_KEY },
        body: form,
    };

    try {
        // Ensure 'audio_chunks' directory exists before writing files
        ensureDirectoryExists('audio_chunks');

        // Step 1: Transcribe audio
        const transcribeResponse = await fetch(TRANSCRIBE_API_URL, transcribeOptions);
        const transcribeData = await transcribeResponse.json();
        fs.unlinkSync(req.file.path); // Cleanup uploaded file

        if (!transcribeData.transcript) {
            return res.status(500).json({ error: 'Transcription failed', details: transcribeData });
        }

        console.log("Transcribed Text:", transcribeData.transcript);
        const transcriptLower = transcribeData.transcript.toLowerCase();

        // Step 2: Send transcript to Flask server
        const queryResponse = await fetch(`http://localhost:8000/query?message=${encodeURIComponent(transcriptLower)}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!queryResponse.ok) {
            const errorText = await queryResponse.text();
            console.error("Flask Error Response:", errorText);
            return res.status(queryResponse.status).json({ error: "Flask API Error", details: errorText });
        }

        const queryResult = await queryResponse.json();
        console.log("Query Response:", queryResult);

        // Step 3: Translate the response to Marathi
        const translationResponse = await axios.post(
            TRANSLATE_API_URL,
            {
                input: queryResult.response,
                source_language_code: 'en-IN',
                target_language_code: 'mr-IN'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': API_KEY
                }
            }
        );

        let translatedText = translationResponse.data.translated_text;
        console.log("Translated Text:", translatedText);

        // Step 4: Split long text into chunks (max 500 characters each)
        function splitText(text, maxLength) {
            let chunks = [];
            let currentChunk = '';

            text.split(/(\.|,|\?|!)/g).forEach((sentence) => {
                if (currentChunk.length + sentence.length < maxLength) {
                    currentChunk += sentence;
                } else {
                    chunks.push(currentChunk);
                    currentChunk = sentence;
                }
            });

            if (currentChunk) chunks.push(currentChunk);
            return chunks;
        }

        const textChunks = splitText(translatedText, 500);
        console.log("Text Chunks:", textChunks);

        let audioFiles = [];
        let audioBase64List = [];

        // Step 5: Generate audio for each text chunk
        for (let i = 0; i < textChunks.length; i++) {
            let response = await axios.post(
                TTS_API_URL,
                {
                    inputs: [textChunks[i]],
                    target_language_code: 'mr-IN',
                    speaker: 'meera',
                    pitch: 0,
                    pace: 1.0,
                    loudness: 1.0,
                    speech_sample_rate: 22050,
                    enable_preprocessing: true,
                    model: 'bulbul:v1'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-subscription-key': API_KEY
                    }
                }
            );

            let audioBase64 = response.data.audios[0];
            let audioFilePath = `audio_chunks/audio_chunk_${i}.wav`;
            fs.writeFileSync(audioFilePath, Buffer.from(audioBase64, 'base64')); // Save as WAV file
            audioFiles.push(audioFilePath);
            audioBase64List.push(audioBase64); // Save Base64 of each chunk
        }

        // Step 6: Merge all audio files using audioconcat
        const mergedAudioFile = "audio_chunks/merged_audio.wav";

        audioconcat(audioFiles)
            .concat(mergedAudioFile)
            .on('start', function (cmd) {
                console.log('Merging started:', cmd);
            })
            .on('error', function (err) {
                console.error('Merging error:', err);
                return res.status(500).json({ error: 'Error merging audio' });
            })
            .on('end', function () {
                console.log("Merged audio created successfully.");

                // Convert final merged audio to Base64
                const finalAudioBase64 = fs.readFileSync(mergedAudioFile).toString('base64');

                // Send final response
                res.json({
                    queryResult,
                    translatedText,
                    audioChunksBase64: audioBase64List, // Base64 of each chunk
                    mergedAudioBase64: finalAudioBase64 // Merged audio Base64
                });
            });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: 'Error processing request', details: error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
