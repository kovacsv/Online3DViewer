import os
import sys
import shutil

from lib import tools_lib as Tools

def Main (argv):
	toolsDir = os.path.dirname (os.path.abspath (__file__))
	rootDir = os.path.dirname (toolsDir)
	os.chdir (rootDir)

	iconsDir = os.path.join (rootDir, 'assets', 'icons')
	tempDir = os.path.join ('build', 'temp')
	if os.path.exists (tempDir):
		shutil.rmtree (tempDir)
	fixedIconsDir = os.path.join (tempDir, 'icons')
	if not os.path.exists (fixedIconsDir):
		os.makedirs (fixedIconsDir)

	iconFontDir = os.path.join (tempDir, 'iconfont')
	if not os.path.exists (iconFontDir):
		os.makedirs (iconFontDir)

	Tools.RunCommand ('oslllo-svg-fixer', [
		'-s', iconsDir,
		'-d', fixedIconsDir
	])
	Tools.RunCommand ('svgo', [fixedIconsDir])
	Tools.RunCommand ('fantasticon', [
		fixedIconsDir,
		'-o', iconFontDir,
		'-t', 'woff',
		'-n', 'O3DVIcons'
	])

	websiteCssDir = os.path.join (rootDir, 'website', 'css')
	websiteIconFontDir = os.path.join (websiteCssDir, 'O3DVIcons')
	if not os.path.exists (websiteIconFontDir):
		os.makedirs (websiteIconFontDir)

	websiteIconsCssPath = os.path.join (websiteCssDir, 'icons.css')
	shutil.copy (os.path.join (iconFontDir, 'O3DVIcons.css'), websiteIconsCssPath)
	Tools.ReplaceStringInFile (websiteIconsCssPath, './O3DVIcons.woff', 'O3DVIcons/O3DVIcons.woff')
	shutil.copy (os.path.join (iconFontDir, 'O3DVIcons.woff'), websiteIconFontDir)

	infoCssDir = os.path.join (rootDir, 'website', 'info', 'css')
	shutil.copy (os.path.join (iconFontDir, 'O3DVIcons.css'), os.path.join (infoCssDir, 'icons.css'))
	shutil.copy (os.path.join (iconFontDir, 'O3DVIcons.woff'), os.path.join (infoCssDir, 'O3DVIcons.woff'))

	shutil.rmtree (tempDir)

	return 0

sys.exit (Main (sys.argv))
