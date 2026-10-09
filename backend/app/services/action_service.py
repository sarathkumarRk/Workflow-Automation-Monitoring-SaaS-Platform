from app.services.email_service import send_email
from app.services.webhook_service import send_webhook


def execute_action(
    action_config: dict,
    input_data: dict,
) -> dict:
    action_type = action_config.get("type")

    try:
        if action_type == "send_email":
            result = send_email(
                to_email=action_config["to_email"],
                subject=action_config["subject"],
                body=action_config["body"],
            )

        elif action_type == "call_webhook":
            result = send_webhook(
                url=action_config["url"],
                payload=input_data,
                headers=action_config.get("headers"),
            )

        elif action_type == "update_status":
            result = {
                "success": True,
                "status": action_config.get(
                    "status", "COMPLETED"
                ),
            }

        else:
            return {
                "success": False,
                "error": f"Unsupported action: {action_type}",
            }

        return result

    except Exception:
        return {
            "success": False,
            "error": "Action execution failed",
        }