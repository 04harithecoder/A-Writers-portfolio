from flask import Flask, render_template, jsonify
import os
import re

app = Flask(__name__)

STORY = {
    "title": "Beyond Age",
    "subtitle": "When Lavender Finds Its Thistles",
    "genre": "Romance · Drama · Cinema",
    "status": "Completed — 2 Parts",
    "parts": 2,
    "quote_from_story": "Vaazhkai ye oru race thaan Pragya... yellarayu yepdiyo namma mundhanum.",
    "description": (
        "A young aspiring film director navigating heartbreak, loss, and love — "
        "set against the backdrop of Chennai's cinema world. "
        "Bhavin's story is about chasing dreams while the people around him "
        "bloom, wither, and find their way back. "
        "A story that asks: does love see age? Does it see anything at all?"
    ),
    "characters": [
        {"name": "Bhavin", "role": "The Lavender", "desc": "An aspiring director with a heart too honest for his own good."},
        {"name": "Paarvati", "role": "The Thistle", "desc": "A senior. A beauty. A person carrying pain she never asked for."},
        {"name": "Pragya", "role": "The Black Dahlia", "desc": "His first love. His biggest heartbreak. His unexpected friend."},
        {"name": "Yuvajagan", "role": "The Anchor", "desc": "The friend who says the hard truth, then shows up anyway."},
    ]
}

QUOTE = "Words are the only things that survive everything — heartbreak, time, and silence."

def parse_story(filepath):
    """Parse story txt into list of {title, paragraphs[]} chapters."""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        raw = f.read()

    # Remove header block (===... lines and title lines at top)
    raw = re.sub(r'=+\n', '', raw)
    raw = re.sub(r'\t+[A-Z :"]+\n', '', raw)

    chapters = []
    # Split on chapter headings like "CHAPTER-1-THE LAVENDER:" or "FINAL CHAPTER-..."
    pattern = re.compile(r'((?:FINAL\s+)?CHAPTER[-–]\S[^\n]*)', re.IGNORECASE)
    parts = pattern.split(raw)

    i = 1
    while i < len(parts):
        raw_title = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ''
        i += 2

        # Clean chapter title → human readable
        # "CHAPTER-1-THE LAVENDER:" → "The Lavender"
        # "FINAL CHAPTER-BLACK DHALIA FROM PAST" → "Black Dhalia from Past"
        title_clean = re.sub(r'^(?:FINAL\s+)?CHAPTER[-–]\d*[-–]?', '', raw_title, flags=re.IGNORECASE)
        title_clean = title_clean.strip(':').strip()
        title_clean = title_clean.title()

        # Split body into paragraphs; handle dialogue lines
        paragraphs = []
        for line in body.split('\n'):
            line = line.strip()
            if not line:
                continue
            # Detect dialogue: lines with NAME says "..." pattern → wrap name bold
            line = re.sub(r'\b([A-Z][A-Z\s]+)\s+(?:says?|ask|asks?|speak[s]?|answer[s]?|shout[s]?|cry|cries|mourns?|interrupts?)\s+"',
                          lambda m: f'<strong>{m.group(1).title()}</strong> says "', line)
            paragraphs.append(line)

        if title_clean and paragraphs:
            chapters.append({'title': title_clean, 'paragraphs': paragraphs})

    return chapters


STORY_FILES = {
    1: os.path.join(os.path.dirname(__file__), 'static', 'Part-1.txt'),
    2: os.path.join(os.path.dirname(__file__), 'static', 'Part-2.txt'),
}

@app.route("/")
def index():
    return render_template("index.html", story=STORY, quote=QUOTE)

@app.route("/api/story/<int:part>")
def get_story(part):
    if part not in STORY_FILES:
        return jsonify({"error": "Part not found"}), 404
    chapters = parse_story(STORY_FILES[part])
    return jsonify({"part": part, "chapters": chapters})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
