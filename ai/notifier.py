import os
from dotenv import load_dotenv
from twilio.rest import Client

# ==================================================
# LOAD .env FROM backend FOLDER (PATH-SAFE)
# ==================================================

# Absolute path of this file → project/ai/notifier.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Go up one level → project/
# Then into backend/.env
ENV_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "backend", ".env")
)

# Load environment variables
load_dotenv(dotenv_path=ENV_PATH)

# ==================================================
# READ ENV VARIABLES
# ==================================================

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")
USER_WHATSAPP_NUMBER = os.getenv("USER_WHATSAPP_NUMBER")

# ==================================================
# WHATSAPP NOTIFIER
# ==================================================

def send_whatsapp_message(message: str):
    if not all([
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER,
        USER_WHATSAPP_NUMBER
    ]):
        print("❌ ERROR: .env not loaded or variables missing")
        return

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    msg = client.messages.create(
        body=message,
        from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
        to=f"whatsapp:{USER_WHATSAPP_NUMBER}",
    )

    print("📲 WhatsApp message sent successfully")
    print("Message SID:", msg.sid)
