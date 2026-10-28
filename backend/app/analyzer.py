from urllib.parse import urlsplit
import ipaddress
import re

SUSPICIOUS_WORDS = {"login", "verify", "account", "secure", "update", "password", "wallet", "bank", "signin"}

def analyze_url(raw: str) -> dict:
    value = raw.strip()
    if not value.lower().startswith(("http://", "https://")):
        value = "https://" + value
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Enter a valid HTTP or HTTPS URL.")
    host = parsed.hostname.lower().rstrip(".")
    indicators = []
    score = 0
    if parsed.scheme == "http":
        score += 15
        indicators.append("The link uses HTTP instead of encrypted HTTPS.")
    try:
        ipaddress.ip_address(host)
        score += 30
        indicators.append("The hostname is a raw IP address rather than a regular domain.")
    except ValueError:
        pass
    if len(value) > 120:
        score += 10
        indicators.append("The URL is unusually long.")
    if host.count(".") >= 4:
        score += 10
        indicators.append("The hostname has an unusually large number of subdomain levels.")
    if "@" in parsed.netloc:
        score += 25
        indicators.append("The address contains an @ symbol that can obscure the actual destination.")
    if host.startswith("xn--") or ".xn--" in host:
        score += 15
        indicators.append("The hostname contains an internationalized/punycode label; verify the spelling carefully.")
    if re.search(r"\d{5,}", host):
        score += 10
        indicators.append("The hostname contains a long numeric sequence.")
    found_words = sorted(w for w in SUSPICIOUS_WORDS if w in (host + parsed.path.lower()))
    if found_words:
        score += min(20, len(found_words) * 5)
        indicators.append("The address includes terms often used in account-verification lures: " + ", ".join(found_words) + ".")
    score = min(score, 100)
    if score >= 50:
        risk = "High Risk"
        explanation = "Several warning signs were found. Avoid opening the link unless you can independently verify the destination."
    elif score >= 25:
        risk = "Suspicious"
        explanation = "Some warning signs were found. Verify the domain through an official source before continuing."
    elif score >= 10:
        risk = "Low Risk"
        explanation = "A small number of warning signs were found. Proceed carefully and check the destination."
    else:
        risk = "Safe"
        explanation = "No warning signs were detected by this basic URL-only check. This does not guarantee the website is safe."
        indicators.append("This prototype does not yet check live threat-intelligence feeds or page content.")
    if not indicators:
        indicators.append("No indicators matched the current prototype rules.")
    return {"normalized_url": value, "risk": risk, "score": score, "explanation": explanation, "indicators": indicators}
