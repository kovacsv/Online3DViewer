import * as esbuild from 'esbuild';

esbuild.build ({
    bundle: true,
    minify: false,
    entryPoints: ['./source/engine/main.js'],
    external: ['three', 'fflate'],
    outfile: './build/o3dv.esm.js',
    format: "esm",
    target: ["node14"]
});
