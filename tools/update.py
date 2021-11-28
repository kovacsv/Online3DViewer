import os
import sys
import json

from lib import tools_lib as Tools

def PrintInfo (message):
	print ('INFO: ' + message)

def PrintError (message):
	print ('ERROR: ' + message)

def Main (argv):
	toolsDir = os.path.dirname (os.path.abspath (__file__))
	rootDir = os.path.dirname (toolsDir)
	os.chdir (rootDir)

	config = None
	with open (os.path.join (toolsDir, 'config.json')) as configJson:
		config = json.load (configJson)

	websiteFiles = [
		os.path.join ('website', 'index.html'),
		os.path.join ('website', 'embed.html')
	]
	for htmlFileName in websiteFiles:
		htmlFilePath = os.path.join (rootDir, htmlFileName)
		replacer = Tools.TokenReplacer (htmlFilePath, True)
		websiteLibFiles = Tools.CreateFileList (config['website_lib_files'], 'libs/', '../libs/')
		embedLibFiles = Tools.CreateFileList (config['embed_lib_files'], 'libs/', '../libs/')
		importerFiles = Tools.CreateFileList (config['engine_files'], 'source/', '../source/')
		websiteCssFiles = Tools.CreateFileList (config['website_files_css'], 'website/', '')
		websiteJsFiles = Tools.CreateFileList (config['website_files_js'], 'website/', '')
		websiteFiles = websiteCssFiles + websiteJsFiles
		replacer.ReplaceTokenFileLinks ('<!-- website libs start -->', '<!-- website libs end -->', websiteLibFiles, None)
		replacer.ReplaceTokenFileLinks ('<!-- embed libs start -->', '<!-- embed libs end -->', embedLibFiles, None)
		replacer.ReplaceTokenFileLinks ('<!-- engine start -->', '<!-- engine end -->', importerFiles, None)
		replacer.ReplaceTokenFileLinks ('<!-- website start -->', '<!-- website end -->', websiteFiles, None)
		replacer.WriteToFile (htmlFilePath)

	sandboxFolder = os.path.join (rootDir, 'sandbox')
	for htmlFileName in os.listdir (sandboxFolder):
		if os.path.splitext (htmlFileName)[1] != '.html':
			continue
		htmlFilePath = os.path.join (sandboxFolder, htmlFileName)
		replacer = Tools.TokenReplacer (htmlFilePath, True)
		importerFiles = Tools.CreateFileList (config['engine_files'], 'source/', '../source/')
		replacer.ReplaceTokenFileLinks ('<!-- engine start -->', '<!-- engine end -->', importerFiles, None)
		replacer.WriteToFile (htmlFilePath)

	return 0

sys.exit (Main (sys.argv))
