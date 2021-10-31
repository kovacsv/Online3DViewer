import os
import re
import sys
import json

from lib import tools_lib as Tools

def PrintInfo (message):
    print ('INFO: ' + message)

def PrintError (message):
    print ('ERROR: ' + message)

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    configFilePath = os.path.join (rootDir, 'tools', 'config.json')
    config = None
    with open (configFilePath) as configJson:
        config = json.load (configJson)

    files = []
    for filePath in config['engine_files']:
        files.append (filePath)
    for filePath in config['website_files_js']:
        files.append (filePath)

    pumlContent = ''
    classNames = []
    classInheritances = []
    for filePath in files:
        content = Tools.GetFileContent (os.path.join (rootDir, filePath))
        for match in re.finditer ('(.*) = class', content):
            classNames.append (match.group (1))
            pumlContent += 'class ' + match.group (1) + '\n'
        for match in re.finditer ('(.*) = class extends (.*)', content):
            classInheritances.append ((match.group (1), match.group (2)))
            pumlContent += match.group (2) + ' <|-- ' + match.group (1) + '\n'

    Tools.WriteContentToFile ('a.puml', pumlContent)
    Tools.RunCommand ('npx', ['puml', 'generate', 'a.puml', '-o', 'a.png'])
    return 0

sys.exit (Main (sys.argv))
