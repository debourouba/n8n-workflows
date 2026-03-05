from flask import Flask, request, jsonify
from imapclient import IMAPClient
import os

app = Flask(__name__)

@app.route('/move-email', methods=['POST'])
def move_email():
    data = request.json
    uid = data.get('uid')
    folder = data.get('folder', 'INBOX/Prospects outbound')
    if not uid:
        return jsonify({'error': 'uid manquant'}), 400
    try:
        with IMAPClient(os.environ['IONOS_IMAP_HOST'], ssl=True) as client:
            client.login(os.environ['IONOS_USER'], os.environ['IONOS_PASS'])
            client.select_folder('INBOX')
            client.move([int(uid)], folder)
        return jsonify({'success': True, 'uid': uid, 'folder': folder})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
        app.run(host='0.0.0.0', port=5001)
