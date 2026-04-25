from slack_bolt import App

def register_commands(app: App):
    @app.command("/meridian")
    def handle_meridian_command(ack, respond, command):
        ack()
        text = command.get("text", "")
        
        if text.startswith("ask"):
            respond(f"🧠 Querying OpenMetadata for: {text[4:]} ...")
        elif text.startswith("impact"):
            respond(f"💥 Calculating blast radius for: {text[7:]} ...")
        elif text.startswith("whoowns"):
            respond(f"🕵️ Finding owner for: {text[8:]} ...")
        else:
            respond("Unknown command. Available commands: ask, impact, whoowns")
