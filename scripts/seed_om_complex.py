import os
import requests
import json

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
        return requests.get(f"{BASE_URL}{endpoint}/name/{payload['name']}", headers=headers).json()
    else:
        print(f"Error {res.status_code} on {endpoint}: {res.text}")
        return None

print("Creating Database Service...")
service = create_entity("/services/databaseServices", {
    "name": "prod_warehouse",
    "serviceType": "Snowflake",
    "connection": {"config": {"type": "Snowflake", "account": "demo", "warehouse": "compute_wh"}}
})

print("Creating Database...")
db = create_entity("/databases", {
    "name": "analytics_db",
    "service": "prod_warehouse"
})

print("Creating Schema...")
schema = create_entity("/databaseSchemas", {
    "name": "public",
    "database": db["fullyQualifiedName"]
})

def create_table(name, columns, description):
    return create_entity("/tables", {
        "name": name,
        "databaseSchema": schema["fullyQualifiedName"],
        "columns": columns,
        "description": description
    })

print("Creating Tables...")

# 1. Sources
raw_events = create_table("raw_events", [
    {"name": "event_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "event_type", "dataType": "VARCHAR", "dataLength": 50},
    {"name": "timestamp", "dataType": "TIMESTAMP"}
], "Raw Kafka event stream for all user interactions.")

raw_users = create_table("raw_users", [
    {"name": "id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "email", "dataType": "VARCHAR", "dataLength": 255, "tags": [{"tagFQN": "PII.Sensitive"}]},
    {"name": "first_name", "dataType": "VARCHAR", "dataLength": 100, "tags": [{"tagFQN": "PII.Sensitive"}]},
    {"name": "last_name", "dataType": "VARCHAR", "dataLength": 100, "tags": [{"tagFQN": "PII.Sensitive"}]}
], "Raw user data synced from production PostgreSQL.")

raw_subs = create_table("raw_subscriptions", [
    {"name": "sub_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "plan_tier", "dataType": "VARCHAR", "dataLength": 50},
    {"name": "amount_cents", "dataType": "INT"},
    {"name": "status", "dataType": "VARCHAR", "dataLength": 20}
], "Raw Stripe subscription webhook data.")

# 2. Staging
stg_events = create_table("stg_events", [
    {"name": "event_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "event_type", "dataType": "VARCHAR", "dataLength": 50},
    {"name": "session_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "event_time", "dataType": "TIMESTAMP"}
], "Cleansed and deduplicated event stream.")

stg_users = create_table("stg_users", [
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "email_hash", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "full_name", "dataType": "VARCHAR", "dataLength": 200, "tags": [{"tagFQN": "PII.Sensitive"}]},
    {"name": "signup_date", "dataType": "DATE"}
], "Cleansed user records with standardized formats.")

stg_subs = create_table("stg_subscriptions", [
    {"name": "subscription_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "mrr_usd", "dataType": "FLOAT"},
    {"name": "is_active", "dataType": "BOOLEAN"}
], "Cleansed subscriptions with calculated MRR.")

# 3. Core/Dimension
dim_users = create_table("dim_users", [
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "email_hash", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "is_active_subscriber", "dataType": "BOOLEAN"},
    {"name": "current_mrr", "dataType": "FLOAT"},
    {"name": "lifetime_value", "dataType": "FLOAT"}
], "Core dimension table containing unified user state and subscription status.")

fct_user_events = create_table("fct_user_events", [
    {"name": "event_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "event_type", "dataType": "VARCHAR", "dataLength": 50},
    {"name": "is_paid_user", "dataType": "BOOLEAN"},
    {"name": "event_time", "dataType": "TIMESTAMP"}
], "Fact table containing all events enriched with user dimension data.")

# 4. Marts
mart_mrr = create_table("mart_monthly_recurring_revenue", [
    {"name": "reporting_month", "dataType": "DATE"},
    {"name": "total_mrr", "dataType": "FLOAT"},
    {"name": "new_mrr", "dataType": "FLOAT"},
    {"name": "churned_mrr", "dataType": "FLOAT"}
], "Aggregated monthly recurring revenue metrics for executive dashboards.")

mart_churn = create_table("mart_churn_prediction_features", [
    {"name": "user_id", "dataType": "VARCHAR", "dataLength": 255},
    {"name": "days_since_last_event", "dataType": "INT"},
    {"name": "events_last_30d", "dataType": "INT"},
    {"name": "churn_probability", "dataType": "FLOAT"}
], "Feature table used by ML models to predict user churn risk.")

print("Creating Lineage Graph...")

def add_lineage(from_tbl, to_tbl):
    requests.put(f"{BASE_URL}/lineage", headers=headers, json={
        "edge": {
            "fromEntity": {"id": from_tbl["id"], "type": "table"},
            "toEntity": {"id": to_tbl["id"], "type": "table"}
        }
    })

# Raw -> Stg
add_lineage(raw_events, stg_events)
add_lineage(raw_users, stg_users)
add_lineage(raw_subs, stg_subs)

# Stg -> Core
add_lineage(stg_users, dim_users)
add_lineage(stg_subs, dim_users)

add_lineage(stg_events, fct_user_events)
add_lineage(dim_users, fct_user_events)

# Core -> Mart
add_lineage(dim_users, mart_mrr)
add_lineage(fct_user_events, mart_churn)

print("Forcing ElasticSearch Re-indexing...")
requests.post(f"{BASE_URL}/search/reindex", headers=headers, json={"batchSize": 100})

print("Complex DAG seeded successfully!")
