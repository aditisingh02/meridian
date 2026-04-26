import os
import httpx
from typing import Dict, Any, List

class OpenMetadataClient:
    def __init__(self):
        self.base_url = os.getenv("OM_BASE_URL", "http://localhost:8585/api/v1")
        self.jwt_token = os.getenv("OM_JWT_TOKEN", "")
        self.headers = {
            "Authorization": f"Bearer {self.jwt_token}" if self.jwt_token else "",
            "Content-Type": "application/json"
        }
        self.client = httpx.AsyncClient(headers=self.headers, base_url=self.base_url, timeout=10.0)

    async def search_entities(self, query: str, index: str = "table_search_index") -> Dict[str, Any]:
        """Search OM entities (tables, pipelines, etc.)"""
        try:
            response = await self.client.get(
                "/search/query",
                params={"q": query, "index": index, "size": 10}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return {"hits": {"hits": []}, "error": "OpenMetadata unreachable"}

    async def get_table_by_fqn(self, fqn: str) -> Dict[str, Any]:
        """Get table details by Fully Qualified Name"""
        try:
            response = await self.client.get(
                f"/tables/name/{fqn}",
                params={"fields": "columns,owner,tags,followers,tableQueries"}
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_lineage_by_name(self, entity_type: str, fqn: str, upstream_depth: int = 1, downstream_depth: int = 1) -> Dict[str, Any]:
        """Get data lineage (blast radius) for an entity"""
        try:
            response = await self.client.get(
                f"/lineage/{entity_type}/name/{fqn}",
                params={
                    "upstreamDepth": upstream_depth,
                    "downstreamDepth": downstream_depth
                }
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None
        
    async def get_test_cases_by_table(self, fqn: str) -> Dict[str, Any]:
        """Get data quality test cases for a table FQN"""
        try:
            response = await self.client.get(
                "/dataQuality/testCases",
                params={"entityLink": f"<#E::table::{fqn}>"}
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

