export function CameraIsEqual3D(a: any, b: any): boolean;
/**
 * Camera projection mode.
 */
export type CameraMode = any;
export namespace CameraMode {
    const Perspective: number;
    const Orthographic: number;
}
/**
 * Camera object.
 */
export class Camera {
    /**
     * @param {Coord3D} eye Eye position.
     * @param {Coord3D} center Center position. Sometimes it's called target or look at position.
     * @param {Coord3D} up Up vector.
     * @param {number} fov Field of view in degrees.
     */
    constructor(eye: Coord3D, center: Coord3D, up: Coord3D, fov: number);
    eye: Coord3D;
    center: Coord3D;
    up: Coord3D;
    fov: number;
    /**
     * Creates a clone of the object.
     * @returns {Camera}
     */
    Clone(): Camera;
}
//# sourceMappingURL=camera.d.ts.map