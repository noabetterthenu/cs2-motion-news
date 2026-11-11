#!/usr/bin/env python3
"""Fetch fresh news exclusively from HLTV's public RSS feed."""
import json
import re
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

FEED_URL = "https://www.hltv.org/rss/news"
OUT = Path("public/news.json")
MAX_AGE_HOURS = 24 * 14
MAX_ITEMS = 60

def clean(value):
    return re.sub(r"<[^>]+>", " ", value or "").replace("&nbsp;", " ").strip()

def get_image(entry):
    for element in entry.iter():
        tag = element.tag.lower()

        if tag.endswith(("content", "thumbnail", "enclosure")):
            url = element.attrib.get("url", "")
            if url and any(ext in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp")):
                return url

        if tag.endswith("description") and element.text:
            match = re.search(r'<img[^>]+src=["\']([^"\']+)', element.text, re.I)
            if match:
                return match.group(1)

    return ""

def parse_date(entry):
    raw = entry.findtext("pubDate")
    if not raw:
        return None
    try:
        return parsedate_to_datetime(raw).astimezone(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        return None

def categorize(title):
    low = title.lower()
    if any(word in low for word in ("patch", "update", "обновлен", "обновление")):
        return "Обновления"
    if any(word in low for word in ("roster", "transfer", "sign ", "joins", "bench", "состав", "трансфер")):
        return "Трансферы"
    if any(word in low for word in ("tournament", "major", "final", "playoff", "qualif", "турнир")):
        return "Турниры"
    return "Команды"

def main():
    now = datetime.now(timezone.utc)
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # Keep recent previously collected HLTV stories if the feed's short window
    # no longer contains them. If the feed fails, do not overwrite good data.
    previous = {}
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
        for item in old.get("articles", []):
            link = item.get("link")
            stamp = item.get("published")
            if link and stamp:
                dt = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
                if now - dt <= timedelta(hours=MAX_AGE_HOURS):
                    previous[link] = item
    except (OSError, ValueError, TypeError, json.JSONDecodeError):
        pass

    request = Request(FEED_URL, headers={
        "User-Agent": "Mozilla/5.0 (compatible; CS2Pulse/1.0; RSS reader)",
        "Accept": "application/rss+xml, application/xml, text/xml"
    })
    with urlopen(request, timeout=30) as response:
        xml_data = response.read()
    feed = ET.fromstring(xml_data)

    fresh_count = 0
    for entry in feed.findall(".//item"):
        title = clean(entry.findtext("title"))
        link = (entry.findtext("link") or "").strip()
        description = clean(entry.findtext("description"))
        published = parse_date(entry)
        if not title or not link or not published:
            continue
        age = now - published
        if age < timedelta(hours=-2) or age > timedelta(hours=MAX_AGE_HOURS):
            continue
        previous[link] = {
            "title": title[:220],
            "summary": (description[:260] + "…") if len(description) > 260 else description,
            "image": get_image(entry) or previous.get(link, {}).get("image", ""),
            "source": "HLTV",
            "category": categorize(title),
            "link": link,
            "published": published.isoformat()
        }
        fresh_count += 1

    articles = sorted(previous.values(), key=lambda item: item["published"], reverse=True)[:MAX_ITEMS]
    payload = {"updated_at": now.isoformat(), "articles": articles}
    temp = OUT.with_suffix(".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(OUT)
    print(f"HLTV RSS: {fresh_count} current feed stories; {len(articles)} stories saved.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Keep the last successful news.json if HLTV is temporarily unavailable.
        print(f"HLTV feed update failed; existing news data was preserved: {exc}")
        raise
