import cloudinary
import cloudinary.uploader

from app.config import settings


def configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_attachment(file_path: str) -> dict:
    try:
        configure_cloudinary()

        result = cloudinary.uploader.upload(
            file_path,
            resource_type="auto",
            folder="workflow_attachments",
        )

        return {
            "success": True,
            "public_id": result.get("public_id"),
            "url": result.get("secure_url"),
            "resource_type": result.get("resource_type"),
        }

    except Exception:
        return {
            "success": False,
            "error": "Attachment upload failed",
        }