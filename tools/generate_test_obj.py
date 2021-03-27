import os
import sys
import math

from lib import tools_lib as Tools

class ObjWriter:
	def __init__ (self):
		self.content = ''
		self.offsetX = 0.0
		self.offsetY = 0.0
		self.offsetZ = 0.0
		self.scale = 1.0
		self.vertexCount = 0
		self.vertexOffset = 0

	def GetContent (self):
		return self.content

	def SetOffset (self, x, y, z):
		self.offsetX = x
		self.offsetY = y
		self.offsetZ = z

	def SetScale (self, scale):
		self.scale = scale

	def AddMesh (self, name):
		self.AddLine ('g ' + name)
		self.vertexOffset = self.vertexCount

	def AddVertex (self, x, y, z):
		self.AddLine ('v ' + ' '.join ([str (x * self.scale + self.offsetX), str (y * self.scale + self.offsetY), str (z * self.scale + self.offsetZ)]))
		self.vertexCount += 1
	
	def AddFace (self, vertices):
		objVertices = []
		for vertex in vertices:
			objVertices.append (str (vertex + self.vertexOffset + 1))
		self.AddLine ('f ' + ' '.join (objVertices))

	def AddLine (self, line):
		self.content += line + '\n'

def DistFromOrigin (x, y, z):
	return math.sqrt (x * x + y * y + z * z)

def Main (argv):
	currentDir = os.path.dirname (os.path.abspath (__file__))
	os.chdir (currentDir)

	ow = ObjWriter ()

	ow.AddMesh ('Tetrahedron')
	a = 1.0
	ow.SetOffset (0.0, 0.0, 0.0)
	ow.SetScale (1.0 / DistFromOrigin (a, a, a))
	ow.AddVertex (+a, +a, +a)
	ow.AddVertex (-a, -a, +a)
	ow.AddVertex (-a, +a, -a)
	ow.AddVertex (+a, -a, -a)
	ow.AddFace ([0, 1, 3])
	ow.AddFace ([0, 2, 1])
	ow.AddFace ([0, 3, 2])
	ow.AddFace ([1, 2, 3])	

	ow.AddMesh ('Hexahedron')
	a = 1.0
	ow.SetOffset (0.0, 3.0, 0.0)
	ow.SetScale (1.0 / DistFromOrigin (a, a, a))
	ow.AddVertex (+a, +a, +a)
	ow.AddVertex (+a, +a, -a)
	ow.AddVertex (+a, -a, +a)
	ow.AddVertex (+a, -a, -a)
	ow.AddVertex (-a, +a, +a)
	ow.AddVertex (-a, +a, -a)
	ow.AddVertex (-a, -a, +a)
	ow.AddVertex (-a, -a, -a)
	ow.AddFace ([0, 1, 5, 4])
	ow.AddFace ([0, 2, 3, 1])
	ow.AddFace ([0, 4, 6, 2])
	ow.AddFace ([1, 3, 7, 5])
	ow.AddFace ([2, 6, 7, 3])
	ow.AddFace ([4, 5, 7, 6])

	ow.AddMesh ('Octahedron')
	a = 1.0
	b = 0.0
	ow.SetOffset (3.0, 0.0, 0.0)
	ow.SetScale (1.0 / DistFromOrigin (a, b, b))
	ow.AddVertex (+a, +b, +b)
	ow.AddVertex (-a, +b, +b)
	ow.AddVertex (+b, +a, +b)
	ow.AddVertex (+b, -a, +b)
	ow.AddVertex (+b, +b, +a)
	ow.AddVertex (+b, +b, -a)
	ow.AddFace ([0, 2, 4])
	ow.AddFace ([0, 3, 5])
	ow.AddFace ([0, 4, 3])
	ow.AddFace ([0, 5, 2])
	ow.AddFace ([1, 2, 5])
	ow.AddFace ([1, 3, 4])
	ow.AddFace ([1, 4, 2])
	ow.AddFace ([1, 5, 3])

	ow.AddMesh ('Dodecahedron')
	a = 1.0
	b = 0.0
	c = (1.0 + math.sqrt (5.0)) / 2.0
	d = 1.0 / c
	ow.SetOffset (3.0, 3.0, 0.0)
	ow.SetScale (1.0 / DistFromOrigin (a, a, a))
	ow.AddVertex (+a, +a, +a)
	ow.AddVertex (+a, +a, -a)
	ow.AddVertex (+a, -a, +a)
	ow.AddVertex (-a, +a, +a)
	ow.AddVertex (+a, -a, -a)
	ow.AddVertex (-a, +a, -a)
	ow.AddVertex (-a, -a, +a)
	ow.AddVertex (-a, -a, -a)
	ow.AddVertex (+b, +d, +c)
	ow.AddVertex (+b, +d, -c)
	ow.AddVertex (+b, -d, +c)
	ow.AddVertex (+b, -d, -c)
	ow.AddVertex (+d, +c, +b)
	ow.AddVertex (+d, -c, +b)
	ow.AddVertex (-d, +c, +b)
	ow.AddVertex (-d, -c, +b)
	ow.AddVertex (+c, +b, +d)
	ow.AddVertex (-c, +b, +d)
	ow.AddVertex (+c, +b, -d)
	ow.AddVertex (-c, +b, -d)
	ow.AddFace ([0, 8, 10, 2, 16])
	ow.AddFace ([0, 16, 18, 1, 12])
	ow.AddFace ([0, 12, 14, 3, 8])
	ow.AddFace ([1, 9, 5, 14, 12])
	ow.AddFace ([1, 18, 4, 11, 9])
	ow.AddFace ([2, 10, 6, 15, 13])
	ow.AddFace ([2, 13, 4, 18, 16])
	ow.AddFace ([3, 14, 5, 19, 17])
	ow.AddFace ([3, 17, 6, 10, 8])
	ow.AddFace ([4, 13, 15, 7, 11])
	ow.AddFace ([5, 9, 11, 7, 19])
	ow.AddFace ([6, 17, 19, 7, 15])

	ow.AddMesh ('Icosahedron')
	a = 1.0
	b = 0.0
	c = (1.0 + math.sqrt (5.0)) / 2.0
	ow.SetOffset (6.0, 1.5, 0.0)
	ow.SetScale (1.0 / DistFromOrigin (b, a, c))
	ow.AddVertex (+b, +a, +c)
	ow.AddVertex (+b, +a, -c)
	ow.AddVertex (+b, -a, +c)
	ow.AddVertex (+b, -a, -c)
	ow.AddVertex (+a, +c, +b)
	ow.AddVertex (+a, -c, +b)
	ow.AddVertex (-a, +c, +b)
	ow.AddVertex (-a, -c, +b)
	ow.AddVertex (+c, +b, +a)
	ow.AddVertex (+c, +b, -a)
	ow.AddVertex (-c, +b, +a)
	ow.AddVertex (-c, +b, -a)
	ow.AddFace ([0, 2, 8])
	ow.AddFace ([0, 4, 6])
	ow.AddFace ([0, 6, 10])
	ow.AddFace ([0, 8, 4])
	ow.AddFace ([0, 10, 2])
	ow.AddFace ([1, 3, 11])
	ow.AddFace ([1, 4, 9])
	ow.AddFace ([1, 6, 4])
	ow.AddFace ([1, 9, 3])
	ow.AddFace ([1, 11, 6])
	ow.AddFace ([2, 5, 8])
	ow.AddFace ([2, 7, 5])
	ow.AddFace ([2, 10, 7])
	ow.AddFace ([3, 5, 7])
	ow.AddFace ([3, 7, 11])
	ow.AddFace ([3, 9, 5])
	ow.AddFace ([4, 8, 9])
	ow.AddFace ([5, 9, 8])
	ow.AddFace ([6, 11, 10])
	ow.AddFace ([7, 10, 11])

	print (ow.GetContent ())
	Tools.WriteContentToFile ('solids.obj', ow.GetContent ())
	
	return 0

sys.exit (Main (sys.argv))
