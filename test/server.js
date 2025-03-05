const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors())

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

app.post('/transcribe_with_node', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path));

    const transcribeOptions = {
        method: 'POST',
        headers: {
            'api-subscription-key': API_KEY,
        },
        body: form,
    };

    try {
        // Step 1: Send audio file to transcription API
        const transcribeResponse = await fetch(TRANSCRIBE_API_URL, transcribeOptions);
        const transcribeData = await transcribeResponse.json();
        fs.unlinkSync(req.file.path); // Cleanup uploaded file

        if (!transcribeData.transcript) {
            return res.status(500).json({ error: 'Transcription failed', details: transcribeData });
        }

        console.log("Transcribed Text:", transcribeData.transcript);
        const transcriptLower = transcribeData.transcript.toLowerCase();
        console.log("Lowercase Text:", transcriptLower);

        // Step 2: Send transcript to Flask server at localhost:8000/query
        const queryResponse = await fetch(`http://localhost:8000/query?message=${encodeURIComponent(transcriptLower)}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!queryResponse.ok) {
            const errorText = await queryResponse.text(); // Read response as text to debug
            console.error("Flask Error Response:", errorText);
            return res.status(queryResponse.status).json({ error: "Flask API Error", details: errorText });
        }

        const queryResult = await queryResponse.json();
        console.log("Query Response:", queryResult);

        // Step 3: Translate the transcript to Marathi using Sarvam.ai's Text Translation API
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

        const translatedText = translationResponse.data.translated_text;
        console.log("Translated Text:", translatedText);

        let inputs = [];
        if (translatedText.length > 500) {
            for (let i = 0; i < translatedText.length; i += 500) {
                inputs.push(translatedText.substring(i, i + 500));
            }
        } else {
            inputs = [translatedText];
        }

        // Step 4: Convert the translated text to speech using Sarvam.ai's Text-to-Speech API
        const ttsResponse = await axios.post(
            TTS_API_URL,
            {
                inputs: inputs,
                target_language_code: 'mr-IN',
                speaker: 'meera', // Options: 'meera', 'pavithra', 'maitreyi', 'arvind', 'amol', 'amartya', etc.
                pitch: 0, // Adjust pitch: -1.0 (lower) to 1.0 (higher)
                pace: 1.0, // Adjust speed: 0.3 (slower) to 3.0 (faster)
                loudness: 1.0, // Adjust loudness: 0.0 (quieter) to 3.0 (louder)
                speech_sample_rate: 22050, // Options: 8000, 16000, 22050
                enable_preprocessing: true, // Enables normalization of English words and numeric entities
                model: 'bulbul:v1' // Model version
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': API_KEY
                }
            }
        );

        const audioBase64 = ttsResponse.data.audios;
        // console.log("Audio Base64:", audioBase64);

        // Combine the query result, translated text, and audio in the response
        res.json({
            queryResult,
            translatedText,
            audioBase64
        });

    } catch (error) {
        // console.error("Error processing request:", error);
        res.status(500).json({ error: 'Error processing request', details: error });
    }
});

const PORT = 9000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
