def log_event(event_type: str, payload: dict):
    with open("audit.log", "a") as f:
        f.write(f"{event_type} | {payload}\n")
