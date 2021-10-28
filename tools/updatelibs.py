import os
import sys
import json
import shutil
import zipfile
import urllib
import urllib.request

from lib import tools_lib as Tools

threeJsFilesMap = [
    [os.path.join ('build', 'three.min.js'), os.path.join ('three.min-$TAG_NAME$.js')],
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

def DownloadFile (url, resultPath):
    PrintInfo ('Downloading ' + url)
    urllib.request.urlretrieve (url, resultPath)

def UnzipFile (zipPath, resultFolder):
	PrintInfo ('Unzipping ' + zipPath)
	with zipfile.ZipFile (zipPath, 'r') as zipFile:
		zipFile.extractall (resultFolder)

def UpdateThreeJs (rootDir, tempDir):
    libsDir = os.path.join (rootDir, 'libs')
    for fileName in os.listdir (libsDir):
        if (fileName.startswith ('three.min-')):
            os.remove (os.path.join (libsDir, fileName))

    response = urllib.request.urlopen ('https://api.github.com/repos/mrdoob/three.js/releases/latest')
    responseJson = json.loads (response.read ())

    threeJsTagName = responseJson['tag_name']

    threeJsFileName = 'three.js-' + threeJsTagName
    threeJsZipPath = os.path.join (tempDir, threeJsFileName + '.zip')
    threeJsExtractedFolderPath = os.path.join (tempDir, threeJsFileName)

    DownloadFile ('https://github.com/mrdoob/three.js/archive/refs/tags/' + threeJsTagName + '.zip', threeJsZipPath)
    UnzipFile (threeJsZipPath, threeJsExtractedFolderPath)

    for threeJsFile in threeJsFilesMap:
        src = os.path.join (tempDir, threeJsFileName, threeJsFileName, threeJsFile[0])
        dst = os.path.join (libsDir, threeJsFile[1].replace ('$TAG_NAME$', threeJsTagName))
        PrintInfo ('Copying file ' + os.path.split (src)[1])
        shutil.copy2 (src, dst)

    PrintInfo ('Replacing file name')
    configFilePath = os.path.join (rootDir, 'tools', 'config.json')
    Tools.ReplaceRegexInFile (configFilePath, 'three.min-r[0-9]+.js', 'three.min-' + threeJsTagName + '.js')
    buildScriptPath = os.path.join (rootDir, 'tools', 'build.py')
    Tools.ReplaceRegexInFile (buildScriptPath, 'three.min-r[0-9]+.js', 'three.min-' + threeJsTagName + '.js')

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    tempDir = os.path.join (rootDir, 'build', 'temp')
    if os.path.exists (tempDir):
        shutil.rmtree (tempDir)
    os.makedirs (tempDir)

    UpdateThreeJs (rootDir, tempDir)
    shutil.rmtree (tempDir)

    return 0

sys.exit (Main (sys.argv))
