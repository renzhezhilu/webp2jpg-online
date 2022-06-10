# !/usr/bin/env python
import webbrowser

# import wx
import PySimpleGUI as sg

from wsgiref.simple_server import make_server

def hello_world_app(environ, start_response):
    status = '200 OK'  # HTTP Status
    headers = [('Content-type', 'text/plain; charset=utf-8')]  # HTTP Headers
    start_response(status, headers)
    msg = 'Hello %s\n' % environ["REMOTE_ADDR"]
    return [msg.encode('utf8')]

with make_server('', 5678, hello_world_app) as httpd:
    print("Serving on port 5678...")
    httpd.serve_forever()

webbrowser.open('https://www.jianshu.com/p/d4eea5b503ed',
                new=0, autoraise=True)

sg.theme('DarkAmber')   # Add a touch of color
# All the stuff inside your window.
layout = [
    [sg.Text('Some text on Row 1')],
    [sg.Text('Enter something on Row 2'), sg.InputText()],
    [sg.Button('Ok'), sg.Button('Cancel')]]

# Create the Window
window = sg.Window('Window Title', layout)
# Event Loop to process "events" and get the "values" of the inputs
while True:
    event, values = window.read()
    if event == sg.WIN_CLOSED or event == 'Cancel':  # if user closes window or clicks cancel
        break
    print('You entered ', values[0])

window.close()


# app = wx.App(False) # Create a new app, don't redirect stdout/stderr to a window.
# frame = wx.Frame(None, wx.ID_ANY, "Hello222 World") # A Frame is a top-level window.
# frame.Show(True) # Show the frame.
# app.MainLoop()

# pyinstaller -F -D -w  hello.py
# wxpython

# https://www.csdn.net/tags/MtTakg2sNTU2MTYtYmxvZwO0O0OO0O0O.html
# http://www.codebaoku.com/it-python/it-python-227355.html
# https://zhuanlan.zhihu.com/p/57674343
# 