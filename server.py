# server.py
from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import os

class RequestHandler(SimpleHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/leaderboard.json':
            with open('leaderboard.json', 'r') as file:
                leaderboard = json.load(file)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(leaderboard).encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/leaderboard.json':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            leaderboard = json.loads(post_data)

            with open('leaderboard.json', 'w') as file:
                json.dump(leaderboard, file, indent=2)

            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(leaderboard).encode())
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run()