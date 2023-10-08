import os
import sys
import shutil

webIfcConverter = 'esbuild {0} --bundle --format=iife --global-name=WebIFC --external:os --external:path --external:fs --external:perf_hooks --outfile={1}'

fileMap = [
    [os.path.join ('draco3d', 'draco_decoder_nodejs.js'), os.path.join ('loaders', 'draco_decoder.js'), None],
    [os.path.join ('draco3d', 'draco_decoder.wasm'), os.path.join ('loaders', 'draco_decoder.wasm'), None],

    [os.path.join ('rhino3dm', 'rhino3dm.js'), os.path.join ('loaders', 'rhino3dm.min.js'), None],
    [os.path.join ('rhino3dm', 'rhino3dm.wasm'), os.path.join ('loaders', 'rhino3dm.wasm'), None],

    [os.path.join ('web-ifc', 'web-ifc-api.js'), os.path.join ('loaders', 'web-ifc-api-browser.js'), webIfcConverter],
    [os.path.join ('web-ifc', 'web-ifc.wasm'), os.path.join ('loaders', 'web-ifc.wasm'), None],

    [os.path.join ('occt-import-js', 'dist', 'occt-import-js.js'), os.path.join ('loaders', 'occt-import-js.js'), None],
    [os.path.join ('occt-import-js', 'dist', 'occt-import-js-worker.js'), os.path.join ('loaders', 'occt-import-js-worker.js'), None],
    [os.path.join ('occt-import-js', 'dist', 'occt-import-js.wasm'), os.path.join ('loaders', 'occt-import-js.wasm'), None],
    [os.path.join ('occt-import-js', 'LICENSE.md'), os.path.join ('loaders', 'occt-import-js.license.md'), None]
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
