import os
import re
import codecs

def PrintInfo (message):
	print ('INFO: ' + message)

def PrintError (message):
	print ('ERROR: ' + message)

def GetFileContent (filePath):
	fileObject = codecs.open (filePath, 'r', 'utf-8')
	content = fileObject.read ()
	fileObject.close ()
	return content

def WriteContentToFile (filePath, content):
	fileObject = codecs.open (filePath, 'w', 'utf-8')
	fileObject.write (content)
	fileObject.close ()

def GetEOLCharFromFile (filePath):
	content = GetFileContent (filePath)
	if content.count ('\r\n') > 0:
		return '\r\n'
	else:
		return '\n'

def RunCommand (executable, arguments):
	command = executable + ' "' + '" "'.join (arguments) + '"'
	return os.system (command)

class TokenReplacer:
	def __init__ (self, filePath, keepToken):
		self.fileContent = GetFileContent (filePath)
		self.eolChar = self.GetEOLChar ()
		self.keepToken = keepToken

	def ReplaceTokenContent (self, begToken, endToken, content):
		begPosition, linePrefix = self.GetTokenBegPosition (begToken)
		endPosition = self.GetTokenEndPosition (endToken)
		if begPosition == -1 or endPosition == -1:
			return
		newContentLines = []
		for contentLine in content.splitlines ():
			newContentLines.append (linePrefix + contentLine)
		newContent = self.eolChar.join (newContentLines)
		self.ReplaceContent (begToken, endToken, begPosition, endPosition + len (endToken), linePrefix, newContent)

	def ReplaceTokenFileLinks (self, begToken, endToken, fileUrls, version):
		begPosition, linePrefix = self.GetTokenBegPosition (begToken)
		endPosition = self.GetTokenEndPosition (endToken)
		if begPosition == -1 or endPosition == -1:
			return
		fileLinks = []
		for fileUrl in fileUrls:
			fileSourceUrl = fileUrl
			if version != None:
				fileSourceUrl += '?v=' + version
			extension = os.path.splitext (fileUrl)[1]
			if (extension == '.js'):
				fileLinks.append (linePrefix + '<script type="text/javascript" src="' + fileSourceUrl + '"></script>')
			elif (extension == '.css'):
				fileLinks.append (linePrefix + '<link rel="stylesheet" type="text/css" href="' + fileSourceUrl + '">')
		newContent = self.eolChar.join (fileLinks)
		self.ReplaceContent (begToken, endToken, begPosition, endPosition + len (endToken), linePrefix, newContent)

	def WriteToFile (self, filePath):
		WriteContentToFile (filePath, self.fileContent)

	def ReplaceContent (self, begToken, endToken, begPosition, endPosition, linePrefix, newContent):
		if self.keepToken:
			newContent = linePrefix + begToken + self.eolChar + newContent + self.eolChar + linePrefix + endToken
		self.ReplaceString (self.fileContent[begPosition : endPosition], newContent)

	def ReplaceString (self, oldString, newString):
		self.fileContent = self.fileContent.replace (oldString, newString)

	def GetTokenBegPosition (self, begToken):
		begPosition = self.fileContent.find (begToken)
		linePrefix = ''
		if begPosition == -1:
			return -1, ''
		while begPosition > 0:
			if self.fileContent[begPosition - 1] == '\n':
				break
			begPosition -= 1
			linePrefix = self.fileContent[begPosition] + linePrefix
		return begPosition, linePrefix

	def GetTokenEndPosition (self, endToken):
		return self.fileContent.find (endToken)

	def GetEOLChar (self):
		if self.fileContent.count ('\r\n') > 0:
			return '\r\n'
		else:
			return '\n'

def ReplaceInFile (filePath, begToken, endToken, newContent):
	content = GetFileContent (filePath)
	begPosition = content.find (begToken)
	endPosition = content.find (endToken)
	if begPosition == -1 or endPosition == -1:
		return
	content = content.replace (content[begPosition : endPosition + len (endToken)], newContent)
	WriteContentToFile (filePath, content)

def ReplaceStringInFile (filePath, oldString, newString):
	content = GetFileContent (filePath)
	content = content.replace (oldString, newString)
	WriteContentToFile (filePath, content)

def ReplaceStringsInFile (filePath, oldNewPairs):
	content = GetFileContent (filePath)
	for oldNewPair in oldNewPairs:
		content = content.replace (oldNewPair[0], oldNewPair[1])
	WriteContentToFile (filePath, content)

def ReplaceRegexInFile (filePath, oldRegex, newRegex):
	content = GetFileContent (filePath)
	content = re.sub (oldRegex, newRegex, content)
	WriteContentToFile (filePath, content)

def CreateFileLinks (fileUrls, linePrefix, eolChar):
	result = ''
	for fileUrl in fileUrls:
		extension = os.path.splitext (fileUrl)[1]
		if (extension == '.js'):
			result += linePrefix + '<script type="text/javascript" src="' + fileUrl + '"></script>' + eolChar
		elif (extension == '.css'):
			result += linePrefix + '<link rel="stylesheet" type="text/css" href="' + fileUrl + '">' + eolChar
	return result

def CreateFileList (fileList, replaceFrom, replaceTo):
	result = []
	for item in fileList:
		result.append (item.replace (replaceFrom, replaceTo))
	return result
