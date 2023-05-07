import os
import sys
import shutil

dracoFileMap = [
    [os.path.join ('draco3d', 'draco_decoder_nodejs.js'), os.path.join ('loaders', 'draco_decoder.js')],
    [os.path.join ('draco3d', 'draco_decoder.wasm'), os.path.join ('loaders', 'draco_decoder.wasm')],
]

rhino3dmFileMap = [
    [os.path.join ('rhino3dm', 'rhino3dm.js'), os.path.join ('loaders', 'rhino3dm.min.js')],
    [os.path.join ('rhino3dm', 'rhino3dm.wasm'), os.path.join ('loaders', 'rhino3dm.wasm')],
]

webIfcFileMap = [
    [os.path.join ('web-ifc', 'web-ifc-api-browser.js'), os.path.join ('loaders', 'web-ifc-api-browser.js')],
    [os.path.join ('web-ifc', 'web-ifc.wasm'), os.path.join ('loaders', 'web-ifc.wasm')],
]

occtImportJsFileMap = [
    [os.path.join ('occt-import-js', 'dist', 'occt-import-js.js'), os.path.join ('loaders', 'occt-import-js.js')],
    [os.path.join ('occt-import-js', 'dist', 'occt-import-js-worker.js'), os.path.join ('loaders', 'occt-import-js-worker.js')],
    [os.path.join ('occt-import-js', 'dist', 'occt-import-js.wasm'), os.path.join ('loaders', 'occt-import-js.wasm')],
    [os.path.join ('occt-import-js', 'LICENSE.md'), os.path.join ('loaders', 'occt-import-js.license.md')]
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

    UpdateModule (dracoFileMap, nodeModulesDir, libsDir)
    UpdateModule (rhino3dmFileMap, nodeModulesDir, libsDir)
    UpdateModule (webIfcFileMap, nodeModulesDir, libsDir)
    UpdateModule (occtImportJsFileMap, nodeModulesDir, libsDir)

    return 0

sys.exit (Main (sys.argv))
