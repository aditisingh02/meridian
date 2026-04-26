import os
import requests
import json
import time

BASE_URL = "http://localhost:8585/api/v1"
with open("backend/.env") as f:
    env_content = f.read()

token = ""
for line in env_content.split("\n"):
    if line.startswith("OM_JWT_TOKEN="):
        token = line.split("=", 1)[1]
        break

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def create_entity(endpoint, payload):
    res = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=payload)
    if res.status_code in [200, 201]:
        return res.json()
    elif res.status_code == 409:
        print(f"Conflict on {endpoint}: {res.text}")
        return requests.get(f"{BASE_URL}{endpoint}/name/{payload['name']}", headers=headers).json()
    else:
        print(f"Error {res.status_code} on {endpoint}: {res.text}")
        return None

print("Creating Database Service...")
service = create_entity("/services/databaseServices", {
    "name": "sample_data_2",
    "serviceType": "Mysql",
    "connection": {"config": {"type": "Mysql", "scheme": "mysql+pymysql", "username": "root", "hostPort": "localhost:3306"}}
})

print("Creating Database...")
db = create_entity("/databases", {
    "name": "ecommerce_db_2",
    "service": "sample_data_2"
})

print("Creating Schema...")
schema = create_entity("/databaseSchemas", {
    "name": "shopify_2",
    "database": db["fullyQualifiedName"]
})

print("Creating Tables...")
raw_customers = create_entity("/tables", {
    "name": "raw_customers",
    "databaseSchema": schema["fullyQualifiedName"],
    "columns": [
        {"name": "id", "dataType": "INT"},
        {"name": "email", "dataType": "VARCHAR", "dataLength": 255, "tags": [{"tagFQN": "PII.Sensitive"}]},
        {"name": "name", "dataType": "VARCHAR", "dataLength": 255, "tags": [{"tagFQN": "PII.Sensitive"}]}
    ],
    "description": "Raw customer data ingested directly from Shopify."
})

dim_customer = create_entity("/tables", {
    "name": "dim_customer",
    "databaseSchema": schema["fullyQualifiedName"],
    "columns": [
        {"name": "customer_id", "dataType": "INT"},
        {"name": "email_hash", "dataType": "VARCHAR", "dataLength": 255},
        {"name": "full_name", "dataType": "VARCHAR", "dataLength": 255}
    ],
    "description": "Cleaned dimension table for customers."
})

orders = create_entity("/tables", {
    "name": "orders",
    "databaseSchema": schema["fullyQualifiedName"],
    "columns": [
        {"name": "order_id", "dataType": "INT"},
        {"name": "customer_id", "dataType": "INT"},
        {"name": "amount", "dataType": "FLOAT"}
    ],
    "description": "Orders made by customers."
})

print("Creating Lineage...")
lineage_payload = {
    "edge": {
        "fromEntity": {"id": raw_customers["id"], "type": "table"},
        "toEntity": {"id": dim_customer["id"], "type": "table"}
    }
}
requests.put(f"{BASE_URL}/lineage", headers=headers, json=lineage_payload)

lineage_payload2 = {
    "edge": {
        "fromEntity": {"id": dim_customer["id"], "type": "table"},
        "toEntity": {"id": orders["id"], "type": "table"}
    }
}
requests.put(f"{BASE_URL}/lineage", headers=headers, json=lineage_payload2)

print("Forcing ElasticSearch Re-indexing...")
requests.post(f"{BASE_URL}/search/reindex", headers=headers, json={"batchSize": 100})

print("Data seeded successfully!")
