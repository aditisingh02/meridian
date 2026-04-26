"""
Slack slash commands for Meridian.
Covers: /meridian (data), /hr-intelligence, /finance-intelligence,
        /pm-feature-confidence, /pm-scope-creep, /pm-dependency-risk,
        /executive-brief, /executive-dashboard
"""
from slack_bolt.async_app import AsyncApp
from openmetadata_client import OpenMetadataClient
from ai.llm import LLMClient
import logging

om_client = OpenMetadataClient()
llm_client = LLMClient()


def _status_emoji(status: str) -> str:
    return {"ON_TRACK": "✅", "AT_RISK": "⚠️", "OFF_TRACK": "🔴"}.get(status, "❓")


def register_commands(app: AsyncApp):

    # ── /meridian ────────────────────────────────────────────────────────────
    @app.command("/meridian")
    async def handle_meridian(ack, respond, command):
        await ack()
        text = command.get("text", "").strip()

        if text.startswith("ask "):
            query = text[4:].strip()
            await respond(f"🧠 *Meridian AI is thinking…* _{query}_")
            try:
                results = await om_client.search_entities(query)
                hits = results.get("hits", {}).get("hits", [])
                ctx = "\n\n".join(
                    f"Table: {h['_source'].get('fullyQualifiedName','')}\n"
                    f"Description: {h['_source'].get('description','')}"
                    for h in hits[:3]
                ) or "No tables found."
                answer = await llm_client.generate_nlq_response(query, ctx)
                await respond(f"🧠 *Answer*\n\n{answer}")
            except Exception as e:
                logging.error(f"/meridian ask error: {e}")
                await respond("❌ Failed to process your question.")

        elif text.startswith("impact "):
            fqn = text[7:].strip()
            await respond(f"💥 *Calculating blast radius for* `{fqn}` …")
            try:
                lineage = await om_client.get_lineage_by_name("table", fqn, downstream_depth=2)
                if not lineage:
                    await respond(f"Could not find lineage for `{fqn}`.")
                    return
                edges = lineage.get("downstreamEdges", [])
                if not edges:
                    await respond(f"✅ *No downstream impact.* Modifying `{fqn}` is safe.")
                else:
                    await respond(f"⚠️ Modifying `{fqn}` impacts *{len(edges)}* downstream entities.")
            except Exception as e:
                logging.error(f"/meridian impact error: {e}")
                await respond("❌ Failed to calculate impact.")

        elif text.startswith("whoowns "):
            fqn = text[8:].strip()
            try:
                data  = await om_client.get_table_by_fqn(fqn)
                owner = (data or {}).get("owner", {})
                if owner:
                    await respond(f"👤 Owner of `{fqn}`: *{owner.get('name') or owner.get('displayName')}*")
                else:
                    await respond(f"🤷 `{fqn}` has no owner assigned.")
            except Exception as e:
                await respond("❌ Failed to look up owner.")
        else:
            await respond(
                "*Meridian Commands*\n"
                "• `/meridian ask <question>` — NLQ on your metadata\n"
                "• `/meridian impact <fqn>` — blast radius analysis\n"
                "• `/meridian whoowns <fqn>` — ownership lookup"
            )

    # ── /hr-intelligence ─────────────────────────────────────────────────────
    @app.command("/hr-intelligence")
    async def handle_hr(ack, respond, command):
        await ack()
        await respond("🔍 *Analysing team health signals…*")
        try:
            from intelligence import hr_intelligence
            data = await hr_intelligence.analyse(days=30)
            if not data.get("configured"):
                await respond("⚠️ Set `GITHUB_TOKEN` + `GITHUB_REPO` to enable HR intelligence.")
                return

            risk  = data["team_burnout_risk"]
            emoji = {"HIGH": "🔴", "MEDIUM": "⚠️", "LOW": "✅"}.get(risk["level"], "❓")
            lines = [
                f"{emoji} *Team Burnout Risk:* {risk['level']} (score {risk['score']}/100)",
                f"⏰ After-hours commits: *{data['after_hours_pct']}%*  {data['signals']['after_hours']}",
                f"📅 Weekend work: *{data['weekend_work_pct']}%*  {data['signals']['weekend']}",
                f"🚀 Commit pace: *{data['commits_per_day']}/day*  {data['signals']['pace']}",
                f"💬 Avg PR engagement: *{data['avg_pr_engagement']} comments*",
                "",
                "*Top risk contributors:*",
            ]
            for dev in data["team_breakdown"][:3]:
                b = dev["burnout"]
                e = {"HIGH": "🔴", "MEDIUM": "⚠️", "LOW": "✅"}.get(b["level"], "")
                lines.append(f"  {e} `{dev['author']}` — {b['level']} ({b['score']}/100), {dev['commits']} commits")

            await respond("\n".join(lines))
        except Exception as e:
            logging.error(f"/hr-intelligence error: {e}")
            await respond("❌ HR analysis failed.")

    # ── /finance-intelligence ─────────────────────────────────────────────────
    @app.command("/finance-intelligence")
    async def handle_finance(ack, respond, command):
        await ack()
        await respond("💰 *Running financial analysis…*")
        try:
            from intelligence import finance_intelligence
            d = await finance_intelligence.analyse(days=30)
            emoji = {"ON_TRACK": "✅", "AT_RISK": "⚠️", "OFF_TRACK": "🔴"}.get(d["budget_health"], "❓")
            lines = [
                f"{emoji} *Budget Health:* {d['budget_health']}",
                f"💵 Engineering cost (30d): *${d['total_cost_usd']:,.0f}*",
                f"📦 PRs shipped: *{d['closed_prs']}*",
                f"💲 Cost per PR: *${d['cost_per_pr_usd']:,.0f}*" if d["cost_per_pr_usd"] else "💲 No PRs closed",
                f"📈 ROI score: *{d['roi_score']}* PRs per $10k",
                f"⏱ Avg cycle time: *{d['avg_cycle_hours']}h*" if d["avg_cycle_hours"] else "",
                f"🗑 Waste hours (after-hours): *{d['waste_hours']}h*",
            ]
            if d["risk_radar"]:
                lines += ["", "*⚠️ Risk Radar:*"]
                for r in d["risk_radar"]:
                    lines.append(f"  • [{r['severity'].upper()}] {r['desc']}")
            await respond("\n".join(l for l in lines if l is not None))
        except Exception as e:
            logging.error(f"/finance-intelligence error: {e}")
            await respond("❌ Finance analysis failed.")

    # ── /pm-feature-confidence ───────────────────────────────────────────────
    @app.command("/pm-feature-confidence")
    async def handle_pm_confidence(ack, respond, command):
        await ack()
        await respond("📊 *Calculating delivery confidence…*")
        try:
            from intelligence import pm_intelligence
            d = await pm_intelligence.analyse()
            if not d.get("configured"):
                await respond("⚠️ Set `JIRA_*` env vars to enable PM intelligence.")
                return
            conf  = d.get("delivery_confidence", {})
            emoji = _status_emoji(conf.get("status", ""))
            lines = [
                f"{emoji} *Delivery Confidence:* {conf.get('status')} ({conf.get('score')}/100)",
                f"🎯 Sprint: *{d.get('sprint_name', '—')}*",
                f"✅ Done: *{d.get('done')}/{d.get('total_issues')}* ({d.get('completion_pct')}%)",
                f"🔄 In Progress: *{d.get('in_progress')}*  |  📋 Todo: *{d.get('todo')}*",
            ]
            await respond("\n".join(lines))
        except Exception as e:
            logging.error(f"/pm-feature-confidence error: {e}")
            await respond("❌ PM confidence analysis failed.")

    # ── /pm-scope-creep ──────────────────────────────────────────────────────
    @app.command("/pm-scope-creep")
    async def handle_pm_scope(ack, respond, command):
        await ack()
        try:
            from intelligence import pm_intelligence
            d = await pm_intelligence.analyse()
            if not d.get("configured"):
                await respond("⚠️ Set `JIRA_*` env vars.")
                return
            pct   = d.get("scope_creep_pct", 0)
            added = d.get("scope_added", 0)
            emoji = "🔴" if pct > 25 else ("⚠️" if pct > 10 else "✅")
            await respond(
                f"{emoji} *Scope Creep — {d.get('sprint_name', 'Current Sprint')}*\n"
                f"• Issues added after sprint start: *{added}*\n"
                f"• Scope growth: *{pct}%*\n"
                f"• Status: {'Critical — sprint at risk' if pct > 25 else 'Moderate' if pct > 10 else 'Under control'}"
            )
        except Exception as e:
            await respond("❌ Scope creep analysis failed.")

    # ── /pm-dependency-risk ──────────────────────────────────────────────────
    @app.command("/pm-dependency-risk")
    async def handle_pm_deps(ack, respond, command):
        await ack()
        try:
            from intelligence import pm_intelligence
            d = await pm_intelligence.analyse()
            if not d.get("configured"):
                await respond("⚠️ Set `JIRA_*` env vars.")
                return
            blocked = d.get("blocked_issues", 0)
            details = d.get("blocked_details", [])
            emoji   = "🔴" if blocked > 2 else ("⚠️" if blocked > 0 else "✅")
            lines   = [f"{emoji} *Dependency Risk:* {blocked} blocked issue(s)"]
            for i in details[:5]:
                lines.append(f"  • `{i['key']}` — {i['summary'][:60]} [{i['status']}]")
            await respond("\n".join(lines))
        except Exception as e:
            await respond("❌ Dependency risk analysis failed.")

    # ── /executive-brief ─────────────────────────────────────────────────────
    @app.command("/executive-brief")
    async def handle_exec_brief(ack, respond, command):
        await ack()
        await respond("🤖 *Generating executive brief…* (this takes ~10s)")
        try:
            from intelligence import executive_intelligence
            text  = command.get("text", "").strip()
            data  = await executive_intelligence.get_brief(days=14)
            emoji = _status_emoji(data["status"])
            msg   = (
                f"{emoji} *Executive Brief — Overall: {data['status']}*\n\n"
                f"{data['brief']}"
            )
            await respond(msg)
        except Exception as e:
            logging.error(f"/executive-brief error: {e}")
            await respond("❌ Executive brief generation failed.")

    # ── /executive-dashboard ─────────────────────────────────────────────────
    @app.command("/executive-dashboard")
    async def handle_exec_dashboard(ack, respond, command):
        await ack()
        await respond("📊 *Pulling executive dashboard signals…*")
        try:
            from intelligence import executive_intelligence
            signals = await executive_intelligence.get_signals(days=14)
            panels  = executive_intelligence._nine_panel_dashboard(signals)
            overall = signals.get("overall_status", "UNKNOWN")
            emoji   = _status_emoji(overall)

            lines = [f"{emoji} *9-Panel Executive Dashboard — {overall}*", ""]
            for p in panels:
                lines.append(f"• *{p['title']}:* {p['value']}")

            await respond("\n".join(lines))
        except Exception as e:
            logging.error(f"/executive-dashboard error: {e}")
            await respond("❌ Dashboard generation failed.")
