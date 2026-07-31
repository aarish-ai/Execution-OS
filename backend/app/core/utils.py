def sanitize_like_pattern(value: str) -> str:
    if not value:
        return ""
    return value.replace("%", "").replace("_", "")
