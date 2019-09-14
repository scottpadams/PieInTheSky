from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO
import threading
import os

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = 'vnkdjnfjknfl1232#'
socketio = SocketIO(app)

@app.route('/')
def sessions():
    return render_template('map.html')

def messageReceived(methods=['GET', 'POST']):
    print('message was received!!!')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@socketio.on('some thing')
def printit(json, methods=['GET', 'POST']):
    # threading.Timer(5.0, printit).start()
    # print(socketio)
    socketio.emit('response from server', "woo", callback=messageReceived)
    print('Hello, World!')

# printit()

@socketio.on('start tracking')
def handle_my_custom_event(json, methods=['GET', 'POST']):
    print('received my event: ' + str(json))

@socketio.on('my event')
def handle_my_custom_event(json, methods=['GET', 'POST']):
    print('received my event: ' + str(json))
    socketio.emit('my response', json, callback=messageReceived)

if __name__ == '__main__':
    socketio.run(app, debug=True)
