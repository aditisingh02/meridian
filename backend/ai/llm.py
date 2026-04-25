import os
from groq import AsyncGroq

class LLMClient:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)
        else:
            self.client = None

    async def generate_nlq_response(self, user_query: str, context: str) -> str:
        """Use LLM to answer a user's natural language query using OpenMetadata context."""
        if not self.client:
            return "Groq API key not configured. I cannot generate an AI response right now."
            
        system_prompt = (
            "You are Meridian, an AI Data Governance assistant. "
            "You have access to metadata from OpenMetadata. Answer the user's questions clearly "
            "and concisely based on the context provided. Do not hallucinate data that is not in the context."
        )
        
        prompt = f"Context:\n{context}\n\nUser Query: {user_query}"
        
        response = await self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            model="llama3-70b-8192",
            temperature=0.2,
        )
        
        return response.choices[0].message.content
