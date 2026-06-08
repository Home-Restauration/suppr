"""Bulk AI event autofill — draft event pages from chef prompts + photos."""
import modal
import os

image = modal.Image.debian_slim().pip_install("fastapi[standard]", "openai")

app = modal.App("suppr-bulk-autofill")

@app.function(image=image, secrets=[modal.Secret.from_name("suppr-secrets")])
@modal.fastapi_endpoint(method="POST")
def run(payload: dict) -> dict:
    from openai import OpenAI

    token = payload.get("service_token")
    if token != os.environ["SERVICE_TOKEN"]:
        return {"error": "unauthorized"}, 401

    events = payload.get("events", [])
    # Event autofill runs on Azure AI Foundry (Llama 4 Maverick) — fast conversational tier.
    llm = OpenAI(
        api_key=os.environ["AZURE_API_KEY"],
        base_url=os.environ["AZURE_ENDPOINT"] + "/models",
        default_query={"api-version": "2024-05-01-preview"},
        default_headers={"api-key": os.environ["AZURE_API_KEY"]},
    )
    model = os.environ["BOT_MODEL"]

    results = []
    for event in events:
        resp = llm.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": 'You write compelling culinary event pages. Respond ONLY with JSON: {"title":"...","description":"...","menu":[{"course":"...","description":"..."}],"feed_caption":"..."}'},
                {"role": "user", "content": f"Chef: {event.get('chef_name')}. Notes: {event.get('notes', '')}. Cuisine: {event.get('cuisine', '')}. Type: {event.get('type', 'supper_club')}."},
            ],
            max_tokens=500,
        )
        draft = resp.choices[0].message.content
        results.append({"event_template_id": event.get("id"), "draft": draft})

    return {"processed": len(results), "results": results}
