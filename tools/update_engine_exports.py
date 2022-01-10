import os
import sys
import json
import re

from lib import tools_lib as Tools

def Main (argv):
	toolsDir = os.path.dirname (os.path.abspath (__file__))
	rootDir = os.path.dirname (toolsDir)
	os.chdir (rootDir)

	config = None
	with open (os.path.join (toolsDir, 'config.json')) as configJson:
		config = json.load (configJson)

	engineFiles = []
	sourceFolder = os.path.join (rootDir, 'source', 'engine')
	for dirName in os.listdir (sourceFolder):
		dirPath = os.path.join (sourceFolder, dirName)
		if not os.path.isdir (dirPath):
			continue
		for fileName in os.listdir (dirPath):
			engineFiles.append ({
				'dirName': dirName,
				'fileName': fileName
			})

	exportedSymbols = []
	mainFileContent = ''
	for engineFile in engineFiles:
		engineFilePath = os.path.join (sourceFolder, engineFile['dirName'], engineFile['fileName'])
		content = Tools.GetFileContent (engineFilePath)
		matches = re.findall ('export class ([a-zA-Z0-9]+)', content)
		matches.extend (re.findall ('export function ([a-zA-Z0-9]+)', content))
		matches.extend (re.findall ('export const ([a-zA-Z0-9]+)', content))
		matches.extend (re.findall ('export let ([a-zA-Z0-9]+)', content))
		if len (matches) == 0:
			continue
		relativePath = './' + engineFile['dirName'] + '/' + engineFile['fileName']
		mainFileContent += 'import { ' + ', '.join (matches) + ' } from \'' + relativePath + '\';\n'
		for match in matches:
			exportedSymbols.append (match)

	mainFileContent += '\nexport {\n'
	for i in range (0, len (exportedSymbols)):
		exportedSymbol = exportedSymbols[i]
		mainFileContent += '    ' + exportedSymbol
		if i < len (exportedSymbols) - 1:
			mainFileContent += ','
		mainFileContent += '\n'
	mainFileContent += '};\n'

	Tools.WriteContentToFile (os.path.join (sourceFolder, 'main.js'), mainFileContent)
	return 0

sys.exit (Main (sys.argv))
