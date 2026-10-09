import httpx


def send_webhook(
    url: str,
    payload: dict,
    headers: dict | None = None,
) -> dict:
    try:
        with httpx.Client(
            timeout=15.0,
            follow_redirects=False,
        ) as client:
            response = client.post(
                url,
                json=payload,
                headers=headers or {},
            )

        return {
            "success": response.is_success,
            "status_code": response.status_code,
            "response": response.text[:2000],
        }

    except httpx.HTTPError as exc:
        return {
            "success": False,
            "error": str(exc),
        }