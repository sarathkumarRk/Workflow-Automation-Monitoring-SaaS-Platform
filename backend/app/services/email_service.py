import smtplib
from email.message import EmailMessage

from app.config import settings


def send_email(to_email: str, subject: str, body: str) -> dict:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_EMAIL
    message["To"] = to_email
    message.set_content(body)

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=15,
        ) as server:
            server.starttls()
            server.login(
                settings.SMTP_EMAIL,
                settings.SMTP_PASSWORD,
            )
            server.send_message(message)

        return {
            "success": True,
            "message": "Email sent successfully",
        }

    except (smtplib.SMTPException, OSError) as exc:
        return {
            "success": False,
            "error": str(exc),
        }