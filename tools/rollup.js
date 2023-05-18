export default [
    {
        input: 'source/engine/main.js',
        output: {
            file: 'build/engine/o3dv.module.js',
            format: 'es'
        },
        external: [
            'fflate',
            'three',
            'three/examples/jsm/loaders/SVGLoader.js',
            'three/examples/jsm/loaders/TGALoader.js',
            'three/examples/jsm/loaders/FBXLoader.js',
            'three/examples/jsm/loaders/ColladaLoader.js',
            'three/examples/jsm/loaders/VRMLLoader.js',
            'three/examples/jsm/loaders/3MFLoader.js',
            'three/examples/jsm/loaders/AMFLoader.js'
        ]
    }
];
