import os
import sys
import shutil
import re

currentPath = os.path.dirname (os.path.abspath (__file__))
os.chdir (currentPath)

def PrintInfo (message):
	print ('Info: ' + message)

def PrintError (error):
	print ('Error: ' + error)

def ReplaceInFile (filePath, source, dest):
	file = open (filePath, 'rb')
	content = file.read ();
	file.close ()
	content = content.replace (source, dest)
	file = open (filePath, 'wb')
	file.write (content);
	file.close ()
	
def BuildWebSite (rootFolder, resultFolder):
	targetFolder = os.path.join (resultFolder, 'website')
	shutil.copytree (os.path.join (rootFolder, 'website'), targetFolder)
	shutil.copytree (os.path.join (rootFolder, 'jsmodeler'), os.path.join (targetFolder, 'jsmodeler'))
	indexFilePath = os.path.join (targetFolder, 'index.html')
	ReplaceInFile (indexFilePath, '../jsmodeler/', 'jsmodeler/')
	
def BuildEmbeddable (rootFolder, resultFolder):
	targetFolder = os.path.join (resultFolder, 'embeddable')
	shutil.copytree (os.path.join (rootFolder, 'embeddable'), targetFolder)
	shutil.copytree (os.path.join (rootFolder, 'jsmodeler'), os.path.join (targetFolder, 'jsmodeler'))
	indexFilePath = os.path.join (targetFolder, 'index.html')
	ReplaceInFile (indexFilePath, '../jsmodeler/', 'jsmodeler/')

def Main ():
	rootFolder = os.path.abspath ('..')
	resultFolder = os.path.join (rootFolder, 'build')
	if os.path.exists (resultFolder):
		shutil.rmtree (resultFolder)
	os.mkdir (resultFolder)
	
	PrintInfo ('Building website to folder <' + resultFolder + '>.')
	BuildWebSite (rootFolder, resultFolder)

	PrintInfo ('Building embeddable example to folder <' + resultFolder + '>.')
	BuildEmbeddable (rootFolder, resultFolder)
	return 0
		
sys.exit (Main ())
