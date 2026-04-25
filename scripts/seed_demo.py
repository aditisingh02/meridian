import time
import requests
import json

FASTAPI_WEBHOOK_URL = "http://localhost:8000/webhooks/openmetadata"
GITHUB_WEBHOOK_URL = "http://localhost:8000/webhooks/github"

print("Seeding demo data and triggering Meridian alerts...")

print("\n1. Triggering mock PII Tag Webhook...")
pii_payload = {
    "eventType": "entityUpdated",
    "entityType": "table",
    "entity": {
        "fullyQualifiedName": "sample_data.ecommerce_db.shopify.customers",
        "name": "customers",
        "description": "Customer records",
        "tags": [{"tagFQN": "PII.Sensitive"}]
    }
}
try:
    requests.post(FASTAPI_WEBHOOK_URL, json=pii_payload)
    print("✅ PII webhook sent successfully")
except Exception as e:
    print(f"❌ Failed to send PII webhook: {e}")

time.sleep(1)

print("\n2. Triggering GitHub PR simulation...")
gh_payload = {
    "action": "opened",
    "pull_request": {
        "number": 42,
        "title": "Drop user_email column from customers table",
        "user": {"login": "aditisingh"}
    }
}
try:
    requests.post(GITHUB_WEBHOOK_URL, json=gh_payload)
    print("✅ GitHub PR webhook sent successfully")
except Exception as e:
    print(f"❌ Failed to send GitHub webhook: {e}")

print("\n🎉 Demo seeding complete!")

