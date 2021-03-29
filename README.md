# Online 3D Viewer

This repository contains the source code of the https://3dviewer.net website. The website can open several 3D file formats and visualize the model in your browser.

[![Build status](https://ci.appveyor.com/api/projects/status/exypq43a8kjby5n0?svg=true)](https://ci.appveyor.com/project/kovacsv/online3dviewer)
[![Build Status](https://travis-ci.com/kovacsv/Online3DViewer.svg?branch=master)](https://travis-ci.com/kovacsv/Online3DViewer)

## Supported file formats

### Import

- obj (with mtl and texture)
- 3ds (with texture)
- stl (text and binary)
- ply (text and binary)
- gltf (text and binary)
- off (text only)

### Export

- obj (with mtl)
- stl (text and binary)
- ply (text and binary)
- gltf (text and binary)
- off (text only)

## Features

- Load model:
  - Select files from a file browser dialog
  - Drag and drop files from your computer
  - Specify files by web url
  - Specify files by web url in hash parameters
- Explore model:
  - Orbit, pan, zoom
  - Set up direction
  - Fit to window
- Investigate model:
  - List used and missing files
  - List all materials and meshes
  - Show/hide and zoom to a specific mesh
  - List materials used by a specific mesh
  - Show model information (model size, vertex and polygon count)
- Export model to various format
- Embed viewer in your website
