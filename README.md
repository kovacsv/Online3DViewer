# Online 3D Viewer

[![Build status](https://github.com/kovacsv/Online3DViewer/actions/workflows/build.yml/badge.svg)](https://github.com/kovacsv/Online3DViewer/actions/workflows/build.yml)
[![npm version](https://badge.fury.io/js/online-3d-viewer.svg)](https://badge.fury.io/js/online-3d-viewer)
[![DeepScan grade](https://deepscan.io/api/teams/16586/projects/19893/branches/524595/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=16586&pid=19893&bid=524595)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/kovacsv/Online3DViewer.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kovacsv/Online3DViewer/context:javascript)

Online 3D Viewer (https://3dviewer.net) is a free and open source web solution to visualize and explore 3D models right in your browser. This repository contains the source code of the website and the library behind it.

## Example

![Start Page](assets/images/3dviewer_net_start_page.png?raw=true)

[Check the live version!](https://3dviewer.net/#model=https://raw.githubusercontent.com/kovacsv/Online3DViewer/dev/test/testfiles/gltf/DamagedHelmet/glTF-Binary/DamagedHelmet.glb)

## Documentation

The repository is separated into two parts. See more information in the [Developer Documentation](https://github.com/kovacsv/Online3DViewer/wiki).

* **Online 3D Viewer Website**: Source code of the web solution with all of the pages and functions.
* **Online 3D Viewer Engine**: Source code of the library to visualize models easily.

## Supported file formats

* **Import**: obj, 3ds, stl, ply, gltf, glb, off, 3dm, fbx, dae, wrl, 3mf, ifc, stp, bim.
* **Export**: obj, stl, ply, gltf, glb, off, 3dm, bim.

## Features

- Import model:
  - Select files from a file browser dialog.
  - Drag and drop files from your computer.
  - Specify files by web url.
  - Specify files by web url in hash parameters.
- Explore model:
  - Orbit, pan, zoom.
  - Set up direction.
  - Fit to window.
- Investigate model:
  - List used and missing files.
  - List all materials and meshes.
  - Show/hide and zoom to a specific mesh.
  - List materials used by a specific mesh.
  - Show model information (model size, vertex and polygon count).
  - Show custom properties stored in the model.
- Export model to various format.
- Embed viewer in your website.

## External Libraries

Online 3D Viewer uses these wonderful libraries: [three.js](https://github.com/mrdoob/three.js), [pickr](https://github.com/Simonwep/pickr), [fflate](https://github.com/101arrowz/fflate), [draco](https://github.com/google/draco), [rhino3dm](https://github.com/mcneel/rhino3dm), [web-ifc](https://github.com/tomvandig/web-ifc), [occt-import-js](https://github.com/kovacsv/occt-import-js).
