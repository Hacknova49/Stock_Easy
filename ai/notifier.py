import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = "AC67e7bfc213d2659f598acaf8e499cd58"
TWILIO_AUTH_TOKEN = "3f5c70a334f95b0b3ac6bfc7c9521934"
TWILIO_WHATSAPP_NUMBER = "+1415523-8886"
USER_WHATSAPP_NUMBER = "+916291438140"

def send_whatsapp_message(message: str):
    if not all([
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER,
        USER_WHATSAPP_NUMBER
    ]):
        print("⚠️ WhatsApp env vars missing, skipping notification")
        return

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    client.messages.create(
        body=message,
        from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
        to=f"whatsapp:{USER_WHATSAPP_NUMBER}",
    )

    print("📲 WhatsApp notification sent")
