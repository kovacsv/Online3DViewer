import os
import sys
import shutil

webIfcConverter = 'esbuild {0} --bundle --format=iife --global-name=WebIFC --external:os --external:path --external:fs --external:perf_hooks --outfile={1}'

fileMap = [
    [os.path.join ('web-ifc', 'web-ifc-api.js'), os.path.join ('web-ifc-api-browser.js'), webIfcConverter],
    [os.path.join ('web-ifc', 'web-ifc.wasm'), os.path.join ('web-ifc.wasm'), None],
]

def PrintInfo (message):
    print ('INFO: ' + message)

def PrintError (message):
    print ('ERROR: ' + message)

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    nodeModulesDir = os.path.join (rootDir, 'node_modules')
    libsDir = os.path.join (rootDir, 'libs')

    for fileEntry in fileMap:
        src = os.path.join (nodeModulesDir, fileEntry[0])
        dst = os.path.join (libsDir, fileEntry[1])
        converter = fileEntry[2]
        if converter == None:
            PrintInfo ('Copying file ' + os.path.split (src)[1])
            shutil.copy2 (src, dst)
        else:
            PrintInfo ('Converting file ' + os.path.split (src)[1])
            result = os.system (converter.format (src, dst))
            assert result == 0

    return 0

sys.exit (Main (sys.argv))
