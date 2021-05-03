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

def JSHintFolder (folder):
	result = Tools.RunCommand ('jshint', [folder])
	if result != 0:
		return False
	return True

def CompressFiles (inputFiles, outputFile):
	parameters = []
	for inputFile in inputFiles:
		extension = os.path.splitext (inputFile)[1]
		if extension == '.js':
			parameters.append ('--js=' + os.path.join ('..', inputFile))
	parameters.append ('--js_output_file=' + outputFile)
	result = Tools.RunCommand ('google-closure-compiler', parameters)
	if result != 0:
		return False
	return True

def CreateDestinationDir (config, rootDir, websiteDir, version, testBuild):
	if not os.path.exists (websiteDir):
		os.makedirs (websiteDir)

	webSourcesDir = os.path.join (websiteDir, 'o3dv')
	if not os.path.exists (webSourcesDir):
		os.makedirs (webSourcesDir)

	shutil.copy2 (os.path.join (rootDir, 'website', 'index.html'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'embed.html'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'robots.txt'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'o3dv', 'website.css'), os.path.join (webSourcesDir, 'o3dv.website.css'))
	shutil.copytree (os.path.join (rootDir, 'libs'), os.path.join (websiteDir, 'libs'))
	shutil.copytree (os.path.join (rootDir, 'website', 'assets'), os.path.join (websiteDir, 'assets'))
	shutil.copytree (os.path.join (rootDir, 'website', 'info'), os.path.join (websiteDir, 'info'))
	
	libFiles = config['lib_files']
	importerFiles = ['o3dv/o3dv.min.js']
	websiteFiles = [
		'o3dv/o3dv.website.css',
		'o3dv/o3dv.website.min.js'
	]
	
	htmlFileNames = [
		'index.html',
		'embed.html',
		os.path.join ('info', 'index.html'),
		os.path.join ('info', 'cookies.html')
	]
	for htmlFileName in htmlFileNames:
		htmlFilePath = os.path.join (websiteDir, htmlFileName)
		replacer = Tools.TokenReplacer (htmlFilePath, False)
		replacer.ReplaceTokenFileLinks ('<!-- libs start -->', '<!-- libs end -->', libFiles, None)
		replacer.ReplaceTokenFileLinks ('<!-- importer start -->', '<!-- importer end -->', importerFiles, version)
		replacer.ReplaceTokenFileLinks ('<!-- website start -->', '<!-- website end -->', websiteFiles, version)
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

def CreatePackage (websiteDir, packageDir, version):
	if not os.path.exists (packageDir):
		os.makedirs (packageDir)

	zipPath = os.path.join (packageDir, 'o3dv_' + version + '.zip')
	zip = zipfile.ZipFile (zipPath, mode = 'w', compression = zipfile.ZIP_DEFLATED)
	zip.write (os.path.join (websiteDir, 'libs', 'three.min-126.js'), 'three.min-126.js')
	zip.write (os.path.join (websiteDir, 'o3dv', 'o3dv.min.js'), 'o3dv.min-' + version + '.js')
	zip.close ()
	return True

def Main (argv):
	currentDir = os.path.dirname (os.path.abspath (__file__))
	os.chdir (currentDir)
	
	rootDir = os.path.abspath ('..')

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
	with open ('config.json') as configJson:
		config = json.load (configJson)

	PrintInfo ('JSHint importer sources.')
	jsHintResult = JSHintFolder (os.path.join (rootDir, 'source'))
	if not jsHintResult:
		PrintError ('JSHint importer sources failed.')
		return 1
	
	PrintInfo ('JSHint website sources.')
	jsHintResult = JSHintFolder (os.path.join (rootDir, 'website', 'o3dv'))
	if not jsHintResult:
		PrintError ('JSHint website sources failed.')
		return 1

	version = GetVersion (rootDir)
	PrintInfo ('Create build directory')
	CreateDestinationDir (config, rootDir, websiteDir, version, testBuild)

	PrintInfo ('Compress importer sources.')
	compressResult = CompressFiles (config['importer_files'], os.path.join (websiteDir, 'o3dv', 'o3dv.min.js'))
	if not compressResult:
		PrintError ('Compress importer sources failed.')
		return 1

	PrintInfo ('Compress website sources.')
	compressResult = CompressFiles (config['website_files'], os.path.join (websiteDir, 'o3dv', 'o3dv.website.min.js'))
	if not compressResult:
		PrintError ('Compress website sources failed.')
		return 1

	PrintInfo ('Create package.')
	packageResult = CreatePackage (websiteDir, packageDir, version)
	if not packageResult:
		PrintError ('Create package failed.')
		return 1

	return 0
	
sys.exit (Main (sys.argv))
