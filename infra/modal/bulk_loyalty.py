"""Bulk loyalty outreach — birthday notes + chef-drop re-engagement."""
import modal
import os

image = modal.Image.debian_slim().pip_install("fastapi[standard]", "httpx", "openai")

app = modal.App("suppr-bulk-loyalty")

@app.function(image=image, secrets=[modal.Secret.from_name("suppr-secrets")])
@modal.fastapi_endpoint(method="POST")
def run(payload: dict) -> dict:
    import httpx
    from openai import OpenAI

    token = payload.get("service_token")
    if token != os.environ["SERVICE_TOKEN"]:
        return {"error": "unauthorized"}, 401

    guests = payload.get("guests", [])
    # Loyalty/comms drafting runs on Azure AI Foundry (Llama 4 Maverick) — fast conversational tier.
    llm = OpenAI(
        api_key=os.environ["AZURE_API_KEY"],
        base_url=os.environ["AZURE_ENDPOINT"] + "/models",
        default_query={"api-version": "2024-05-01-preview"},
        default_headers={"api-key": os.environ["AZURE_API_KEY"]},
    )
    model = os.environ["BOT_MODEL"]

    results = []
    for guest in guests:
        resp = llm.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You write warm, concise, 1-sentence re-engagement messages for a culinary experience platform. Be personal and warm, not salesy."},
                {"role": "user", "content": f"Guest: {guest.get('name')}. Context: {guest.get('context', '')}"},
            ],
            max_tokens=80,
        )
        message = resp.choices[0].message.content.strip()
        # POST back to apps/api to enqueue the notification
        httpx.post(
            f"{os.environ['API_URL']}/internal/notifications/enqueue",
            json={"recipient": guest["contact"], "channel": guest["channel"], "message": message},
            headers={"X-Service-Token": os.environ["SERVICE_TOKEN"]},
        )
        results.append({"guest_id": guest.get("id"), "ok": True})

    return {"processed": len(results), "results": results}
