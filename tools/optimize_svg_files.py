import os
import sys

from lib import tools_lib as Tools

def Main (argv):
	currentDir = os.path.dirname (os.path.abspath (__file__))
	os.chdir (currentDir)
	imagesPath = os.path.abspath (os.path.join ('..', 'website', 'assets', 'images'))
	Tools.RunCommand ('svgo', ['-r', imagesPath])
	return 0

sys.exit (Main (sys.argv))
