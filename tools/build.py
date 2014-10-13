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
	websiteFolder = os.path.join (resultFolder, 'website')
	shutil.copytree (os.path.join (rootFolder, 'website'), websiteFolder)
	shutil.copytree (os.path.join (rootFolder, 'frameworks'), os.path.join (websiteFolder, 'frameworks'))
	indexFilePath = os.path.join (websiteFolder, 'index.html')
	ReplaceInFile (indexFilePath, '../frameworks/', 'frameworks/')
	
def Main ():
	rootFolder = os.path.abspath ('..')
	resultFolder = os.path.join (rootFolder, 'build')
	if os.path.exists (resultFolder):
		shutil.rmtree (resultFolder)
	os.mkdir (resultFolder)
	
	PrintInfo ('Building website to folder <' + resultFolder + '>.')
	BuildWebSite (rootFolder, resultFolder)
	return 0
		
sys.exit (Main ())
