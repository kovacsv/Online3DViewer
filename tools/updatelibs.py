import os
import sys
import re
import shutil

from lib import tools_lib as Tools

pickrFileMap = [
    [os.path.join ('@simonwep', 'pickr', 'LICENSE'), os.path.join ('pickr.license.md')],
    [os.path.join ('@simonwep', 'pickr', 'dist', 'pickr.es5.min.js'), os.path.join ('pickr.es5.min.js')],
    [os.path.join ('@simonwep', 'pickr', 'dist', 'themes', 'monolith.min.css'), os.path.join ('pickr.monolith.min.css')]
]

threeJsFileMap = [
    [os.path.join ('three', 'LICENSE'), os.path.join ('three.license.md')],
    [os.path.join ('three', 'build', 'three.min.js'), os.path.join ('three.min.js')],
    [os.path.join ('three', 'examples', 'js', 'libs', 'chevrotain.min.js'), os.path.join ('three_loaders', 'chevrotain.min.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', '3MFLoader.js'), os.path.join ('three_loaders', '3MFLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'ColladaLoader.js'), os.path.join ('three_loaders', 'ColladaLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'FBXLoader.js'), os.path.join ('three_loaders', 'FBXLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'VRMLLoader.js'), os.path.join ('three_loaders', 'VRMLLoader.js')],
    [os.path.join ('three', 'examples', 'js', 'loaders', 'SVGLoader.js'), os.path.join ('three_loaders', 'SVGLoader.js')]
]

dracoFileMap = [
    [os.path.join ('draco3d', 'draco_decoder_nodejs.js'), os.path.join ('loaders', 'draco_decoder.js')],
    [os.path.join ('draco3d', 'draco_decoder.wasm'), os.path.join ('loaders', 'draco_decoder.wasm')],
]

rhino3dmFileMap = [
    [os.path.join ('rhino3dm', 'rhino3dm.js'), os.path.join ('loaders', 'rhino3dm.min.js')],
    [os.path.join ('rhino3dm', 'rhino3dm.wasm'), os.path.join ('loaders', 'rhino3dm.wasm')],
]

fflateFileMap = [
    [os.path.join ('fflate', 'LICENSE'), os.path.join ('loaders', 'fflate.license.md')],
    [os.path.join ('fflate', 'umd', 'index.js'), os.path.join ('loaders', 'fflate.min.js')],
]

webIfcFileMap = [
    [os.path.join ('web-ifc', 'web-ifc-api.js'), os.path.join ('loaders', 'web-ifc-api.js')],
    [os.path.join ('web-ifc', 'web-ifc.wasm'), os.path.join ('loaders', 'web-ifc.wasm')],
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

def FixWebIfcExport (libsDir):
    apiFilePath = os.path.join (libsDir, 'loaders', 'web-ifc-api.js')
    regex = re.compile (r'export \{.*\};', re.DOTALL)
    Tools.ReplaceRegexInFile (apiFilePath, regex, '')

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    nodeModulesDir = os.path.join (rootDir, 'node_modules')
    libsDir = os.path.join (rootDir, 'libs')

    UpdateModule (pickrFileMap, nodeModulesDir, libsDir)
    UpdateModule (threeJsFileMap, nodeModulesDir, libsDir)
    UpdateModule (dracoFileMap, nodeModulesDir, libsDir)
    UpdateModule (rhino3dmFileMap, nodeModulesDir, libsDir)
    UpdateModule (fflateFileMap, nodeModulesDir, libsDir)
    UpdateModule (webIfcFileMap, nodeModulesDir, libsDir)
    FixWebIfcExport (libsDir)

    return 0

sys.exit (Main (sys.argv))
