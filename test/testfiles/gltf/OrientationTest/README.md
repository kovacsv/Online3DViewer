# Orientation Test

## Screenshot

![screenshot](screenshot/screenshot.png)

## Description

This model tests the orientation supplied by nodes in the hierarchy.  The red, green, and blue arrows test X, Y, and Z rotations respectively expressed as quaternions in the nodes.  The cyan, magenta, and yellow arrows test X, Y, and Z rotations respectively expressed with rotation matrices in the nodes.

Each arrow has a target indicator of the same color, opposite the point.  These target indicators have their positions and orientations baked into their vertex data, so do not rely on node transformations to appear correct.

Thus, if each colored arrow points directly at a target of the same color, the test passes.  If an arrow appears to have been rotated away from the target of the same color, it could indicate a misplaced matrix transpose or some other orientation problem.

## Sample Test Failure

![Sample Test Failure](screenshot/OrientationTestFail.png)

This failed render shows what happens if the rotation quaternions are converted to transposed rotations (in this case, converted to a 3x3 rotation matrix that was transposed).  This same effect is caused if there is confusion between row-major and column-major matrix ordering.

This image shows the red, green, and blue arrows, which all use rotation quaternions on the three axes.  On the opposite sides of the cube, the cyan, magenta, and yellow arrows perform the same kinds of tests (with slightly different angles) using node orientation matrices in the glTF directly.  Thus, it's possible that only one set or the other set of arrows will fail the test.

## License Information

Copyright 2018 Analytical Graphics, Inc.
CC-BY 4.0 https://creativecommons.org/licenses/by/4.0/
Model by Ed Mackey.
