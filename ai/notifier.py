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

import re

def send_whatsapp_message(message: str, to_number: str = None):
    # Use provided number or fallback to .env
    raw_recipient = to_number if to_number and to_number.strip() else USER_WHATSAPP_NUMBER
    
    # Clean the number: keep only digits and +
    recipient = re.sub(r"[^\d+]", "", str(raw_recipient))

    if not all([
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER,
        recipient
    ]):
        print(f"❌ ERROR: Twilio credentials or recipient missing. Recipient: {recipient}")
        return

    # Twilio sandbox requires the + prefix
    if not recipient.startswith("+"):
        print(f"⚠️ WARNING: WhatsApp number '{recipient}' missing '+' prefix. Twilio might fail.")

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
            to=f"whatsapp:{recipient}",
        )
        print(f"📲 WhatsApp message sent to {recipient} | SID: {msg.sid}")
    except Exception as e:
        print(f"❌ Twilio Error: {e}")
