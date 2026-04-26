import os
try:
    from groq import Groq
except ImportError:  # pragma: no cover - optional dependency
    Groq = None

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY")) if Groq and os.environ.get("GROQ_API_KEY") else None

def translate_to_om_api(user_question: str) -> str:
    """
    Translates a plain English question into an OpenMetadata API path.
    Example: 'Who owns the users table?' -> '/tables/name/users'
    """
    prompt = f"""
    You are an expert at OpenMetadata. The user asks: "{user_question}"
    
    Return ONLY the OpenMetadata REST API path to fetch the requested resource.
    Do not return any explanation or markdown formatting.
    
    Examples:
    "Who owns the payments table?" -> "/v1/tables/name/payments"
    "Show me columns in the users table" -> "/v1/tables/name/users"
    """
    
    if not client:
        return "/v1/search/query?q=*"

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You output only the raw API path."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.1-8b-instant",
    )
    
    return response.choices[0].message.content.strip()

def analyze_pii_column(column_name: str) -> bool:
    """
    Determines if a given column name likely contains PII.
    """
    prompt = f"Does the column name '{column_name}' likely contain Personally Identifiable Information (PII)? Answer 'Yes' or 'No'."
    
    if not client:
        lowered = column_name.lower()
        return any(token in lowered for token in ("email", "phone", "name", "address", "ssn"))

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You answer only Yes or No."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.1-8b-instant",
    )
    
    answer = response.choices[0].message.content.strip().lower()
    return "yes" in answer
