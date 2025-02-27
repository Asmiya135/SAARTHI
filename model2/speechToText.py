from flask import Flask, request, jsonify, send_file
from groq import Groq
from dotenv import load_dotenv
import requests
import os
from gtts import gTTS  # Google Text-to-Speech for Marathi TTS

# Load environment variables
load_dotenv()

# Initialize the Groq client with API key
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not set in the environment variables.")
client = Groq(api_key=groq_api_key)

# Sarvam AI Mayura API details
mayura_api_url = "https://api.sarvam.ai/translate"
mayura_api_key = os.getenv('MAYURA_API_KEY')

# Initialize Flask app
app = Flask(__name__)

@app.route('/transcribe', methods=['POST'])
def transcribe_and_translate():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided.'}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    # Save the uploaded audio file temporarily
    audio_path = os.path.join('/tmp', audio_file.filename)
    audio_file.save(audio_path)

    try:
        with open(audio_path, 'rb') as file:
            audio_content = file.read()

        # Transcribe audio
        transcription = client.audio.transcriptions.create(
            file=(audio_file.filename, audio_content),
            model="whisper-large-v3-turbo",
            response_format="json"
        )
        transcribed_text = transcription.text

        # Translate to English
        translation = client.audio.translations.create(
            file=(audio_file.filename, audio_content),
            model="whisper-large-v3",
            response_format="json"
        )
        translated_text = translation.text

        return jsonify({
            'transcription': transcribed_text,
            'translation': translated_text
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

@app.route('/translate_to_marathi', methods=['POST'])
def translate_to_marathi():
    data = request.get_json()
    if 'text' not in data:
        return jsonify({'error': 'No text provided for translation.'}), 400

    english_text = data['text']
    # print(english_text)

    try:
        # Attempt translation using Sarvam AI's Mayura
        headers = {
            "api-subscription-key": "0ced95ba-6c6b-44aa-ad0e-afc589ff0102",
            "Content-Type": "application/json"
        }
        payload = {
            "input": english_text,
            "source_language_code": "en-IN",
            "target_language_code": "mr-IN",
            "model": "mayura:v1",
            "mode": "formal",
            "speaker_gender": "Male",
            "enable_preprocessing": False
        }
        print(payload)
        mayura_response = requests.request("POST",mayura_api_url, json=payload, headers=headers)
        # if mayura_response.status_code == 200:
        print("using mayura")
        print(mayura_response)
        marathi_text = mayura_response.json().get('translated_text', '')
        # else:
        #     # Fallback to Groq's llama3-8b-8192 model
        #     print("using GROQ ")
        #     groq_response = client.chat.completions.create(
        #         model="llama3-8b-8192",
        #         messages=[
        #             {"role": "system", "content": "Translate the following text to Marathi. Only provide the translation."},
        #             {"role": "user", "content": english_text}
        #         ]
        #     )
        # marathi_text = groq_response.choices[0].message.content.strip()

        # Convert Marathi text to speech (if available)
        tts = gTTS(marathi_text, lang='mr')  # Marathi language code
        audio_output_path = "/tmp/marathi_translation.mp3"
        tts.save(audio_output_path)

        return jsonify({
            'marathi_translation': marathi_text,
            'audio_url': request.host_url + "download_mp3"
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_mp3', methods=['GET'])
def download_mp3():
    audio_path = "/tmp/marathi_translation.mp3"
    if os.path.exists(audio_path):
        return send_file(audio_path, as_attachment=True)
    else:
        return jsonify({'error': 'Audio file not found.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
