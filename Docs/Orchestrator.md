NOT:
default:
"Ich denke, wir sollten jetzt competitor-researcher starten."


PLEASE:
if (
    opportunity.status == "PAIN_VERIFIED"
    and evidence.independent_sources >= 5
):
    enqueue("market_research")
    enqueue("competitor_research")
