import os
import sys
import json
import shutil
import zipfile
import urllib
import urllib.request

from lib import tools_lib as Tools

threeJsFilesMap = [
    [os.path.join ('build', 'three.min.js'), os.path.join ('three.min.js')],
    [os.path.join ('examples', 'js', 'libs', 'chevrotain.min.js'), os.path.join ('three_loaders', 'chevrotain.min.js')],
    [os.path.join ('examples', 'js', 'loaders', '3MFLoader.js'), os.path.join ('three_loaders', '3MFLoader.js')],
    [os.path.join ('examples', 'js', 'loaders', 'ColladaLoader.js'), os.path.join ('three_loaders', 'ColladaLoader.js')],
    [os.path.join ('examples', 'js', 'loaders', 'FBXLoader.js'), os.path.join ('three_loaders', 'FBXLoader.js')],
    [os.path.join ('examples', 'js', 'loaders', 'VRMLLoader.js'), os.path.join ('three_loaders', 'VRMLLoader.js')]
]

def PrintInfo (message):
    print ('INFO: ' + message)

def PrintError (message):
    print ('ERROR: ' + message)

def UpdateThreeJs (moduleDir, libsDir):
    for threeJsFile in threeJsFilesMap:
        src = os.path.join (moduleDir, threeJsFile[0])
        dst = os.path.join (libsDir, threeJsFile[1])
        PrintInfo ('Copying file ' + os.path.split (src)[1])
        shutil.copy2 (src, dst)

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    libsDir = os.path.join (rootDir, 'libs')

    threeJsModuleDir = os.path.join (rootDir, 'node_modules', 'three')
    UpdateThreeJs (threeJsModuleDir, libsDir)

    return 0

sys.exit (Main (sys.argv))
