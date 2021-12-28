# Vertex Color Test

## Screenshot

![screenshot](screenshot/screenshot.png)

## Description

This model tests the attribute semantic `COLOR_0`, as defined in the glTF [Metallic Roughness Material](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material), to check if it has been multipled by `baseColor`.  For engines that read the vertex colors and apply them, you should see two rows of checkmarks, as shown in the screenshot.  The top row is the "Test" row, which has been multipled by red, green, and blue vertex colors to reveal checkmarks in the corresponding color channels.  The bottom row is a "sample pass" row, where checkmarks of each color are multiplied by white and should appear the same as the screenshot regardless of the rendering engine's ability to process vertex colors.

For engines that ignore vertex colors, the top row of checks will look noticably mangled.  The red check has a cyan X, the green check has a magenta X, and the blue check has a yellow X, occupying the other two color channels of each test checkmark.  If you see these "X" marks fighting with the checkmarks, then you are seeing color channels that are supposed to have been zeroed out by the applied vertex colors on the mesh, and it means your rendering engine has not applied the vertex colors.
