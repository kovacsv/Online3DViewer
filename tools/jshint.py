import os
import sys
import re

currentPath = os.path.dirname (os.path.abspath (__file__))
os.chdir (currentPath)

configFilePath = 'jshintconfig.json'
sourcesFolderName = '../src/include'

def PrintInfo (message):
	print ('Info: ' + message)

def PrintError (error):
	print ('Error: ' + error)

def JSHintFolder (folderPath):
	result = os.system ('jshint --config ' + configFilePath + ' ' + folderPath)
	if result != 0:
		return False
	return True
	
def Main ():
	sourcesPath = os.path.abspath (sourcesFolderName)
	
	PrintInfo ('JSHint folder <' + sourcesPath + '>.')
	succeeded = JSHintFolder (sourcesPath)
	if not succeeded:
		PrintError ('Found JSHint errors.');
		return 1

	return 0
		
sys.exit (Main ())
