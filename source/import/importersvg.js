OV.ImporterThreeSvg = class extends OV.ImporterThreeBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'svg';
    }

    GetUpDirection ()
    {
        return OV.Direction.Z;
    }

    GetExternalLibraries ()
    {
        return [
            'three_loaders/SVGLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        return new THREE.SVGLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        function ShowFill (path)
        {
            const style = path.userData.style;
            if (style.fill === undefined || style.fill === 'none') {
                return false;
            }
            return true;
        }

        function ShowStroke (path)
        {
            const style = path.userData.style;
            if (style.stroke === undefined || style.stroke === 'none') {
                return false;
            }
            return true;
        }

        let object = new THREE.Object3D ();

        let fillsObject = new THREE.Object3D ();
        let strokesObject = new THREE.Object3D ();

        fillsObject.name = 'Fills';
        strokesObject.name = 'Strokes';

        object.add (fillsObject);
        object.add (strokesObject);

        const material = new THREE.MeshPhongMaterial ({
            color: 0xcc0000
        });
        for (let path of loadedObject.paths) {
            const shapes = THREE.SVGLoader.createShapes (path);
            if (ShowFill (path)) {
                for (const shape of shapes) {
                    const geometry = new THREE.ShapeGeometry (shape);
                    const mesh = new THREE.Mesh (geometry, material);
                    fillsObject.add (mesh);
                }
            }
            if (ShowStroke (path)) {
                for (const subPath of path.subPaths) {
                    const geometry = THREE.SVGLoader.pointsToStroke (subPath.getPoints (), path.userData.style);
                    if (geometry) {
                        const mesh = new THREE.Mesh (geometry, material);
                        strokesObject.add (mesh);
                    }
                }
            }
        }
        return object;
    }
};
