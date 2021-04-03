# Online 3D Viewer

This repository contains the source code of the https://3dviewer.net website and the library behind it. Online 3D Viewer is a free and open source web solution to visualize and explore 3D models right in your browser. 

### Online 3D Viewer Website

Full source code of the web solution all of the pages and functions. It uses Online 3D Viewer Engine under the hood.

### Online 3D Viewer Engine

Library to visualize models easily on your own website. See more in the developer documentation.

[![Build status](https://ci.appveyor.com/api/projects/status/exypq43a8kjby5n0?svg=true)](https://ci.appveyor.com/project/kovacsv/online3dviewer)
[![Build Status](https://travis-ci.com/kovacsv/Online3DViewer.svg?branch=master)](https://travis-ci.com/kovacsv/Online3DViewer)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/kovacsv/Online3DViewer.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kovacsv/Online3DViewer/context:javascript)
[![codecov](https://codecov.io/gh/kovacsv/Online3DViewer/branch/master/graph/badge.svg?token=xD8Kek6gQz)](https://codecov.io/gh/kovacsv/Online3DViewer)

## Documentation

- [User Documentation](https://3dviewer.net/info)
- [Developer Documentation](https://github.com/kovacsv/Online3DViewer/wiki)

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
