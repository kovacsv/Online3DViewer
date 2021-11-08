import os
import sys
import json
import shutil
import zipfile
import urllib
import urllib.request

from lib import tools_lib as Tools

threeJsFileMap = [
    [os.path.join ('three', 'build', 'three.min.js'), os.path.join ('three.min.js')],
    [os.path.join ('three', 'examples', 'js', 'libs', 'chevrotain.min.js'), os.path.join ('three_loaders', 'chevrotain.min.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', '3MFLoader.js'), os.path.join ('three_loaders', '3MFLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'ColladaLoader.js'), os.path.join ('three_loaders', 'ColladaLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'FBXLoader.js'), os.path.join ('three_loaders', 'FBXLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'VRMLLoader.js'), os.path.join ('three_loaders', 'VRMLLoader.js')]
]

rhino3dmFileMap = [
    [os.path.join ('rhino3dm', 'rhino3dm.js'), os.path.join ('loaders', 'rhino3dm.min.js')],
    [os.path.join ('rhino3dm', 'rhino3dm.wasm'), os.path.join ('loaders', 'rhino3dm.wasm')],
]

def PrintInfo (message):
    print ('INFO: ' + message)

def PrintError (message):
    print ('ERROR: ' + message)

def UpdateModule (fileMap, moduleDir, libsDir):
    for fileEntry in fileMap:
        src = os.path.join (moduleDir, fileEntry[0])
        dst = os.path.join (libsDir, fileEntry[1])
        PrintInfo ('Copying file ' + os.path.split (src)[1])
        shutil.copy2 (src, dst)

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    nodeModulesDir = os.path.join (rootDir, 'node_modules')
    libsDir = os.path.join (rootDir, 'libs')

    UpdateModule (threeJsFileMap, nodeModulesDir, libsDir)
    UpdateModule (rhino3dmFileMap, nodeModulesDir, libsDir)

    return 0

sys.exit (Main (sys.argv))
