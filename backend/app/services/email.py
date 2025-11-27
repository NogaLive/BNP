from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Envía un correo electrónico real usando SendGrid.
    """
    if not settings.SENDGRID_API_KEY:
        logger.warning("⚠️ SENDGRID_API_KEY no configurada. El correo no se enviará.")
        return False

    if not settings.SENDGRID_SENDER:
        logger.warning("⚠️ SENDGRID_SENDER no configurado. El correo no se enviará.")
        return False

    message = Mail(
        from_email=settings.SENDGRID_SENDER,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"✅ SendGrid Status: {response.status_code}") # Debug
        return True
    except Exception as e:
        # IMPRIMIR EL ERROR COMPLETO
        print(f"❌ Error SendGrid: {str(e)}")
        if hasattr(e, 'body'):
            print(f"❌ Detalle: {e.body}") # Esto te dirá por qué falla
        return False

def send_otp_email(to_email: str, code: str):
    """
    Plantilla específica para enviar códigos OTP.
    """
    subject = "Código de Recuperación - BNP Servicios"
    content = f"""
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Recuperación de Cuenta</h2>
        <p>Has solicitado restablecer tu contraseña o verificar tu identidad.</p>
        <p>Tu código de verificación es:</p>
        <h1 style="color: #D91023; letter-spacing: 5px;">{code}</h1>
        <p>Este código expirará en <strong>{settings.OTP_EXP_MINUTES} minutos</strong>.</p>
        <hr>
        <p style="font-size: 12px; color: #777;">Si no solicitaste este código, ignora este mensaje.</p>
    </div>
    """
    return send_email(to_email, subject, content)