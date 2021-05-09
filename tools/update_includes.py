import os
import sys
import json

from lib import tools_lib as Tools

def PrintInfo (message):
	print ('INFO: ' + message)

def PrintError (message):
	print ('ERROR: ' + message)

def Main (argv):
	currentDir = os.path.dirname (os.path.abspath (__file__))
	os.chdir (currentDir)
	
	config = None
	with open ('config.json') as configJson:
		config = json.load (configJson)

	rootDir = os.path.abspath ('..')
	websiteFiles = [
		os.path.join ('website', 'index.html'),
		os.path.join ('website', 'embed.html')
	]
	for htmlFileName in websiteFiles:
		htmlFilePath = os.path.join (rootDir, htmlFileName)
		replacer = Tools.TokenReplacer (htmlFilePath, True)
		libFiles = Tools.CreateFileList (config['lib_files'], 'libs/', '../libs/')
		importerFiles = Tools.CreateFileList (config['importer_files'], 'source/', '../source/')
		websiteFiles = Tools.CreateFileList (config['website_files'], 'website/', '')
		replacer.ReplaceTokenFileLinks ('<!-- libs start -->', '<!-- libs end -->', libFiles, None)
		replacer.ReplaceTokenFileLinks ('<!-- importer start -->', '<!-- importer end -->', importerFiles, None)
		replacer.ReplaceTokenFileLinks ('<!-- website start -->', '<!-- website end -->', websiteFiles, None)
		replacer.WriteToFile (htmlFilePath)

	sandboxFolder = os.path.join (rootDir, 'sandbox')
	for htmlFileName in os.listdir (sandboxFolder):
		if os.path.splitext (htmlFileName)[1] != '.html':
			continue
		htmlFilePath = os.path.join (sandboxFolder, htmlFileName)
		replacer = Tools.TokenReplacer (htmlFilePath, True)
		importerFiles = Tools.CreateFileList (config['importer_files'], 'source/', '../source/')
		replacer.ReplaceTokenFileLinks ('<!-- importer start -->', '<!-- importer end -->', importerFiles, None)
		replacer.WriteToFile (htmlFilePath)
		
	return 0

sys.exit (Main (sys.argv))
