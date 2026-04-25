from slack_bolt.async_app import AsyncApp
from openmetadata_client import OpenMetadataClient
from ai.llm import LLMClient
import json
import logging

om_client = OpenMetadataClient()
llm_client = LLMClient()

def register_commands(app: AsyncApp):
    @app.command("/meridian")
    async def handle_meridian_command(ack, respond, command):
        await ack()
        text = command.get("text", "").strip()
        
        if text.startswith("ask "):
            query = text[4:].strip()
            await respond(f"🧠 *Meridian AI is thinking...* _{query}_")
            
            try:
                # 1. Fetch relevant metadata from OpenMetadata based on query
                search_results = await om_client.search_entities(query)
                hits = search_results.get("hits", {}).get("hits", [])
                
                context_parts = []
                for hit in hits[:3]: # take top 3
                    source = hit.get("_source", {})
                    fqn = source.get("fullyQualifiedName", "")
                    desc = source.get("description", "")
                    context_parts.append(f"Table FQN: {fqn}\nDescription: {desc}")
                
                context = "\n\n".join(context_parts) if context_parts else "No specific tables found in metadata."
                
                # 2. Ask Groq LLM to synthesize an answer
                answer = await llm_client.generate_nlq_response(query, context)
                
                await respond(f"🧠 *Meridian AI Answer*\n\n{answer}")
            except Exception as e:
                logging.error(f"Error in /meridian ask: {e}")
                await respond("❌ Failed to process your question.")

        elif text.startswith("impact "):
            fqn = text[7:].strip()
            await respond(f"💥 *Calculating blast radius for:* `{fqn}` ...")
            
            try:
                lineage = await om_client.get_lineage_by_name("table", fqn, downstream_depth=2)
                if not lineage:
                    await respond(f"Could not find lineage for `{fqn}`.")
                    return
                
                downstream_nodes = lineage.get("downstreamEdges", [])
                node_ids = {edge["toEntity"] for edge in downstream_nodes}
                
                if not node_ids:
                    await respond(f"✅ *No downstream impact detected.* Modifying `{fqn}` is safe.")
                else:
                    await respond(f"⚠️ *Warning!* Modifying `{fqn}` will impact *{len(node_ids)}* downstream entities.")
            except Exception as e:
                logging.error(f"Error in /meridian impact: {e}")
                await respond("❌ Failed to calculate impact.")

        elif text.startswith("whoowns "):
            fqn = text[8:].strip()
            await respond(f"🕵️ *Looking up owner for:* `{fqn}` ...")
            try:
                table_data = await om_client.get_table_by_fqn(fqn)
                if not table_data:
                    await respond(f"Could not find table `{fqn}`.")
                    return
                
                owner = table_data.get("owner", {})
                if owner:
                    owner_name = owner.get("name") or owner.get("displayName")
                    await respond(f"👤 The owner of `{fqn}` is *{owner_name}*.")
                else:
                    await respond(f"🤷 `{fqn}` currently has *no owner assigned*.")
            except Exception as e:
                logging.error(f"Error in /meridian whoowns: {e}")
                await respond("❌ Failed to find owner.")
        else:
            await respond("Unknown command. Available commands: \n- `/meridian ask [question]`\n- `/meridian impact [table_fqn]`\n- `/meridian whoowns [table_fqn]`")

