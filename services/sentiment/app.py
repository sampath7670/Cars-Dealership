from flask import Flask, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
app = Flask(__name__)
analyzer = SentimentIntensityAnalyzer()

@app.get('/analyze/<path:text>')
def analyze(text):
    if not 1 <= len(text) <= 3000:
        return jsonify(error='Text must contain 1 to 3000 characters.'), 400
    scores = analyzer.polarity_scores(text)
    label = 'positive' if scores['compound'] >= .05 else 'negative' if scores['compound'] <= -.05 else 'neutral'
    return jsonify(text=text, sentiment=label, scores=scores)

@app.get('/health')
def health():
    return jsonify(status='ok')

if __name__ == '__main__':
    from waitress import serve
    serve(app, host='127.0.0.1', port=5000)
