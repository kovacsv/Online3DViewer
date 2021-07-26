import os
import sys

from lib import tools_lib as Tools

def Main (argv):
	toolsDir = os.path.dirname (os.path.abspath (__file__))
	rootDir = os.path.dirname (toolsDir)
	os.chdir (rootDir)
	imagesPath = os.path.abspath (os.path.join ('website', 'assets', 'images'))
	Tools.RunCommand ('svgo', ['-r', imagesPath])
	return 0

sys.exit (Main (sys.argv))
