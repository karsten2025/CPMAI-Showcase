import os
from dotenv import load_dotenv
from google import genai

# Lädt die Variablen aus deiner .env Datei
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Fehler: Kein API-Key in der .env gefunden!")
else:
    try:
        # Initialisierung mit dem neuen SDK
        client = genai.Client(api_key=api_key)

        # Test-Prompt für deine Value Engine mit dem aktuellen Modell
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Define the core goal of a Cybernetic PMO in one sentence.",
        )

        print(f"✅ Verbindung erfolgreich! Antwort der KI:\n{response.text}")
    except Exception as e:
        print(f"❌ Fehler bei der Kommunikation: {e}")
