import os
import sys
import shutil
import zipfile
import json

from lib import tools_lib as Tools

def PrintInfo (message):
	print ('INFO: ' + message)

def PrintError (message):
	print ('ERROR: ' + message)

def GetVersion (rootDir):
	packageJson = None
	with open (os.path.join (rootDir, 'package.json')) as packageJsonFile:
		packageJson = json.load (packageJsonFile)
	return packageJson['version']

def CreateDestinationDir (config, rootDir, websiteDir, version, testBuild):
	if not os.path.exists (websiteDir):
		os.makedirs (websiteDir)

	if not os.path.exists (os.path.join (websiteDir, 'o3dv')):
		os.makedirs (os.path.join (websiteDir, 'o3dv'))

	shutil.copy2 (os.path.join (rootDir, 'website', 'index.html'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'embed.html'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'robots.txt'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'build', 'o3dv.website.min.js'), os.path.join (websiteDir, 'o3dv'))
	shutil.copy2 (os.path.join (rootDir, 'build', 'o3dv.website.min.css'), os.path.join (websiteDir, 'o3dv'))
	shutil.copytree (os.path.join (rootDir, 'libs'), os.path.join (websiteDir, 'libs'))
	shutil.copytree (os.path.join (rootDir, 'website', 'assets'), os.path.join (websiteDir, 'assets'))
	shutil.copytree (os.path.join (rootDir, 'website', 'css', 'Quicksand'), os.path.join (websiteDir, 'o3dv', 'Quicksand'))
	shutil.copytree (os.path.join (rootDir, 'website', 'css', 'O3DVIcons'), os.path.join (websiteDir, 'o3dv', 'O3DVIcons'))
	shutil.copytree (os.path.join (rootDir, 'website', 'info'), os.path.join (websiteDir, 'info'))

	websiteLibFiles = config['website_lib_files']
	embedLibFiles = config['embed_lib_files']
	websiteFiles = [
		'o3dv/o3dv.website.min.css',
		'o3dv/o3dv.website.min.js'
	]

	htmlFileNames = [
		'index.html',
		'embed.html',
		os.path.join ('info', 'index.html'),
		os.path.join ('info', 'cookies.html'),
		os.path.join ('info', 'faq.html')
	]
	for htmlFileName in htmlFileNames:
		htmlFilePath = os.path.join (websiteDir, htmlFileName)
		replacer = Tools.TokenReplacer (htmlFilePath, False)
		replacer.ReplaceTokenFileLinks ('<!-- website libs start -->', '<!-- website libs end -->', websiteLibFiles, version)
		replacer.ReplaceTokenFileLinks ('<!-- embed libs start -->', '<!-- embed libs end -->', embedLibFiles, version)
		replacer.ReplaceTokenFileLinks ('<!-- website start -->', '<!-- website end -->', websiteFiles, version)
		initScriptContent = ''
		initScriptContent += '<script type="text/javascript">' + replacer.eolChar
		initScriptContent += '     OV.StartWebsite (\'libs\');' + replacer.eolChar
		initScriptContent += '</script>'
		embedInitScriptContent = ''
		embedInitScriptContent += '<script type="text/javascript">' + replacer.eolChar
		embedInitScriptContent += '     OV.StartEmbed (\'libs\');' + replacer.eolChar
		embedInitScriptContent += '</script>'
		replacer.ReplaceTokenContent ('<!-- website init start -->', '<!-- website init end -->', initScriptContent)
		replacer.ReplaceTokenContent ('<!-- embed init start -->', '<!-- embed init end -->', embedInitScriptContent)
		metaFile = os.path.join (rootDir, 'tools', 'website_meta_data.txt')
		if os.path.exists (metaFile):
			metaContent = Tools.GetFileContent (metaFile)
			replacer.ReplaceTokenContent ('<!-- meta start -->', '<!-- meta end -->', metaContent)
		analyticsFile = os.path.join (rootDir, 'tools', 'website_analytics_data.txt')
		if os.path.exists (analyticsFile) and not testBuild:
			analyticsContent = Tools.GetFileContent (analyticsFile)
			replacer.ReplaceTokenContent ('<!-- analytics start -->', '<!-- analytics end -->', analyticsContent)
		scriptFile = os.path.join (rootDir, 'tools', 'website_script_data.txt')
		if os.path.exists (scriptFile):
			scriptContent = Tools.GetFileContent (scriptFile)
			replacer.ReplaceTokenContent ('<!-- script start -->', '<!-- script end -->', scriptContent)
		replacer.WriteToFile (htmlFilePath)

def CreatePackage (rootDir, websiteDir, packageDir, version):
	if not os.path.exists (packageDir):
		os.makedirs (packageDir)

	zipPath = os.path.join (packageDir, 'o3dv_' + version + '.zip')
	zip = zipfile.ZipFile (zipPath, mode = 'w', compression = zipfile.ZIP_DEFLATED)
	for lib in os.listdir (os.path.join (websiteDir, 'libs', 'loaders')):
		zip.write (os.path.join (websiteDir, 'libs', 'loaders', lib), 'libs/loaders/' + lib)
	for lib in os.listdir (os.path.join (websiteDir, 'libs', 'three_loaders')):
		zip.write (os.path.join (websiteDir, 'libs', 'three_loaders', lib), 'libs/three_loaders/' + lib)
	zip.write (os.path.join (websiteDir, 'libs', 'three.min.js'), 'three.min.js')
	zip.write (os.path.join (websiteDir, 'libs', 'three.license.md'), 'three.license.md')
	zip.write (os.path.join (rootDir, 'build', 'o3dv.min.js'), 'o3dv.min.js')
	zip.write (os.path.join (rootDir, 'LICENSE.md'), 'o3dv.license.md')
	zip.close ()
	return True

def Main (argv):
	toolsDir = os.path.dirname (os.path.abspath (__file__))
	rootDir = os.path.dirname (toolsDir)
	os.chdir (rootDir)

	testBuild = False

	buildDir = os.path.join (rootDir, 'build', 'final')
	if len (argv) >= 2 and argv[1] == 'test':
		testBuild = True
		buildDir = os.path.join (rootDir, 'build', 'test')
		PrintInfo ('Creating test build.')

	websiteDir = os.path.join (buildDir, 'website')
	packageDir = os.path.join (buildDir, 'package')
	if os.path.exists (buildDir):
		shutil.rmtree (buildDir)

	config = None
	with open (os.path.join (toolsDir, 'config.json')) as configJson:
		config = json.load (configJson)

	version = GetVersion (rootDir)
	PrintInfo ('Create build directory')
	CreateDestinationDir (config, rootDir, websiteDir, version, testBuild)

	PrintInfo ('Create package.')
	packageResult = CreatePackage (rootDir, websiteDir, packageDir, version)
	if not packageResult:
		PrintError ('Create package failed.')
		return 1

	return 0

sys.exit (Main (sys.argv))
