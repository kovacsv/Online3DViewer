import os
import sys
import re

from lib import utils as Utils

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    sourceDirs = [
        os.path.join (rootDir, 'source'),
        os.path.join (rootDir, 'plugins'),
    ]

    relevantFiles = []
    for sourceDir in sourceDirs:
        for root, subdirs, files in os.walk (sourceDir):
            for file in files:
                if os.path.splitext (file)[1] == '.js':
                    relevantFiles.append (os.path.join (root, file))

    strings = []
    for file in relevantFiles:
        fileContent = Utils.GetFileContent (file)
        locMatches = re.findall ('[^F]Loc\s{0,1}\(\'(.*?)\'\)', fileContent)
        flocMatches = re.findall ('FLoc\s{0,1}\(\'(.*?)\'\,', fileContent)
        for matches in [locMatches, flocMatches]:
            for match in matches:
                if not match in strings:
                    strings.append (match.replace ('\\\'', '\''))

    strings.sort ()
    for string in strings:
        print (string)

    return 0

sys.exit (Main (sys.argv))
