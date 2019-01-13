# Online 3D Viewer

Online 3D Viewer is an engine to visualize 3D models online.

Supported file formats:
  - 3ds (with textures)
  - obj, mtl (with textures)
  - stl (ascii and binary)
  - off (only ascii)

## Website

This is the source code for http://3dviewer.net.

### Features

- Open 3ds, obj, stl and off files by file open or drag and drop.
- Multiple file support. You can open or drag and drop the referenced files together. For example:
  - Open the requested mtl file with an obj file.
  - Open textures with 3ds file.
- Open files from location hash.
  - Define file as a server url like [this](http://3dviewer.net/#https://cdn.rawgit.com/kovacsv/Online3DViewer/9e9ca71d/website/testfiles/cube.3ds).
  - Define file relative to the root folder like [this](http://3dviewer.net/#testfiles/cube.3ds).
  - Define multiple files like [this](http://3dviewer.net/#testfiles/multimesh.obj,testfiles/multimesh.mtl).
- Show basic information about the model and the meshes.
- Show/Hide a mesh by clicking the eye icon in the mesh list.
- Isolate a mesh by clicking the eye icon while pressing control key in the mesh list.
- Highlight a mesh by clicking it in the 3D model, or clicking the highlight icon in the mesh list.
- Fit the whole model or a selected mesh to the window.
- Copy mesh name to clipboard.

## Embeddable

This is the embeddable version of the viewer:
- In this case you should host the 3D models.
- See examples for more information.
