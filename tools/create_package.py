import os
import sys
import shutil
import zipfile
import json

from lib import utils as Utils

def GetVersion (rootDir):
	packageJson = None
	with open (os.path.join (rootDir, 'package.json')) as packageJsonFile:
		packageJson = json.load (packageJsonFile)
	return packageJson['version']

def CreateWebsite (rootDir, websiteDir, version, testBuild):
	if not os.path.exists (websiteDir):
		os.makedirs (websiteDir)

	shutil.copy2 (os.path.join (rootDir, 'website', 'index.html'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'embed.html'), websiteDir)
	shutil.copy2 (os.path.join (rootDir, 'website', 'robots.txt'), websiteDir)
	shutil.copytree (os.path.join (rootDir, 'build', 'website'), os.path.join (websiteDir, 'o3dv'))
	shutil.copytree (os.path.join (rootDir, 'website', 'assets'), os.path.join (websiteDir, 'assets'))
	shutil.copytree (os.path.join (rootDir, 'website', 'info'), os.path.join (websiteDir, 'info'))

	pluginFiles = []
	pluginsDir = os.path.join (rootDir, 'plugins')
	if os.path.exists (pluginsDir):
		for pluginFile in os.listdir (pluginsDir):
			if os.path.splitext (pluginFile)[1] != '.js':
				continue
			websitePluginsDir = os.path.join (websiteDir, 'plugins');
			if not os.path.exists (websitePluginsDir):
				os.makedirs (websitePluginsDir)
			shutil.copy2 (os.path.join (pluginsDir, pluginFile), os.path.join (websitePluginsDir, pluginFile))
			pluginFiles.append ('plugins/' + pluginFile)

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
		replacer = Utils.TokenReplacer (htmlFilePath, False)
		replacer.ReplaceTokenFileLinks ('<!-- website start -->', '<!-- website end -->', websiteFiles, version)
		replacer.ReplaceTokenFileLinks ('<!-- plugins start -->', '<!-- plugins end -->', pluginFiles, version)
		metaFile = os.path.join (rootDir, 'plugins', 'website_meta_data.txt')
		if os.path.exists (metaFile):
			metaContent = Utils.GetFileContent (metaFile)
			replacer.ReplaceTokenContent ('<!-- meta start -->', '<!-- meta end -->', metaContent)
		introFooterFile = os.path.join (rootDir, 'plugins', 'website_intro_footer_data.txt')
		if os.path.exists (introFooterFile) and not testBuild:
			introFooterContent = Utils.GetFileContent (introFooterFile)
			replacer.ReplaceTokenContent ('<!-- intro footer start -->', '<!-- intro footer end -->', introFooterContent)
		websiteAnalyticsFile = os.path.join (rootDir, 'plugins', 'website_analytics_data.txt')
		if os.path.exists (websiteAnalyticsFile) and not testBuild:
			websiteAnalyticsContent = Utils.GetFileContent (websiteAnalyticsFile)
			replacer.ReplaceTokenContent ('<!-- website analytics start -->', '<!-- website analytics end -->', websiteAnalyticsContent)
		embedAnalyticsFile = os.path.join (rootDir, 'plugins', 'embed_analytics_data.txt')
		if os.path.exists (websiteAnalyticsFile) and not testBuild:
			embedAnalyticsContent = Utils.GetFileContent (embedAnalyticsFile)
			replacer.ReplaceTokenContent ('<!-- embed analytics start -->', '<!-- embed analytics end -->', embedAnalyticsContent)
		replacer.WriteToFile (htmlFilePath)

def CreateEnginePackage (rootDir, engineDir, websiteDir):
	if not os.path.exists (engineDir):
		os.makedirs (engineDir)

	zipPath = os.path.join (engineDir, 'o3dv.zip')
	zip = zipfile.ZipFile (zipPath, mode = 'w', compression = zipfile.ZIP_DEFLATED)
	for file in os.listdir (os.path.join (websiteDir, 'assets', 'envmaps')):
		filePath = os.path.join (websiteDir, 'assets', 'envmaps', file)
		if os.path.isdir (filePath):
			for fileInDir in os.listdir (filePath):
				zip.write (os.path.join (filePath, fileInDir), 'envmaps/' + file + '/' + fileInDir)
		else:
			zip.write (filePath, 'envmaps/' + file)
	zip.write (os.path.join (rootDir, 'build', 'engine', 'o3dv.min.js'), 'o3dv.min.js')
	zip.write (os.path.join (rootDir, 'LICENSE.md'), 'o3dv.license.md')
	zip.close ()
	return True

def Main (argv):
	toolsDir = os.path.dirname (os.path.abspath (__file__))
	rootDir = os.path.dirname (toolsDir)
	os.chdir (rootDir)

	testBuild = False

	buildDir = os.path.join (rootDir, 'build', 'package')
	if len (argv) >= 2 and argv[1] == 'test':
		testBuild = True
		buildDir = os.path.join (rootDir, 'build', 'package_test')
		Utils.PrintInfo ('Creating test build.')

	websiteDir = os.path.join (buildDir, 'website')
	engineDir = os.path.join (buildDir, 'engine')
	if os.path.exists (buildDir):
		shutil.rmtree (buildDir)

	version = GetVersion (rootDir)
	Utils.PrintInfo ('Create build directory')
	CreateWebsite (rootDir, websiteDir, version, testBuild)

	Utils.PrintInfo ('Create package.')
	packageResult = CreateEnginePackage (rootDir, engineDir, websiteDir)
	if not packageResult:
		Utils.PrintError ('Create package failed.')
		return 1

	return 0

sys.exit (Main (sys.argv))
