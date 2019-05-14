import os
import sys
import shutil
import re

currentPath = os.path.dirname (os.path.abspath (__file__))
os.chdir (currentPath)

extensions = [
	#{
	#	'name' : 'ExampleExtension',
	#	'path' : 'extensions/example/example.js'
	#}
]

def PrintInfo (message):
	print ('Info: ' + message)

def PrintError (error):
	print ('Error: ' + error)

def ReplaceInFile (filePath, source, dest):
	file = open (filePath, 'rb')
	content = file.read ();
	file.close ()
	content = re.sub (source, dest, content, flags = re.MULTILINE | re.DOTALL)
	file = open (filePath, 'wb')
	file.write (content);
	file.close ()
	
def BuildWebSite (rootFolder, resultFolder, extensions):
	targetFolder = os.path.join (resultFolder, 'website')
	shutil.copytree (os.path.join (rootFolder, 'website'), targetFolder)
	shutil.copytree (os.path.join (rootFolder, 'jsmodeler'), os.path.join (targetFolder, 'jsmodeler'))
	indexFilePath = os.path.join (targetFolder, 'index.html')
	importerAppFilePath = os.path.join (targetFolder, 'include', 'importerapp.js')
	ReplaceInFile (indexFilePath, 'var useAnalytics = false;', 'var useAnalytics = true;')
	ReplaceInFile (indexFilePath, '../jsmodeler/', 'jsmodeler/')
	extensionIncludes = ''
	for extension in extensions:
		extensionIncludes += '<script type="text/javascript" src="' + extension['path'] + '"></script>\r\n\t'
	ReplaceInFile (indexFilePath, '\<\!\-\- ExtensionIncludes \-\-\>.*\<\!\-\- ExtensionIncludesEnd \-\-\>', extensionIncludes)
	extensionIncludes = ''
	for extension in extensions:
		extensionIncludes += 'importerApp.AddExtension (new ' + extension['name'] + ' ());\r\n\t'
	ReplaceInFile (importerAppFilePath, '\/\/ ExtensionIncludes.*\/\/ ExtensionIncludesEnd', extensionIncludes)
	
def BuildEmbeddable (rootFolder, resultFolder):
	targetFolder = os.path.join (resultFolder, 'embeddable')
	shutil.copytree (os.path.join (rootFolder, 'embeddable'), targetFolder)
	shutil.copytree (os.path.join (rootFolder, 'jsmodeler'), os.path.join (targetFolder, 'jsmodeler'))
	indexFilePath = os.path.join (targetFolder, 'multiple.html')
	ReplaceInFile (indexFilePath, '../jsmodeler/', 'jsmodeler/')
	indexFilePath = os.path.join (targetFolder, 'fullscreen.html')
	ReplaceInFile (indexFilePath, '../jsmodeler/', 'jsmodeler/')
	
def Main ():
	rootFolder = os.path.abspath ('..')
	resultFolder = os.path.join (rootFolder, 'build')
	if os.path.exists (resultFolder):
		shutil.rmtree (resultFolder)
	os.mkdir (resultFolder)
	
	PrintInfo ('Building website to folder <' + resultFolder + '>.')
	BuildWebSite (rootFolder, resultFolder, extensions)

	PrintInfo ('Building embeddable example to folder <' + resultFolder + '>.')
	BuildEmbeddable (rootFolder, resultFolder)
	
	return 0
		
sys.exit (Main ())
