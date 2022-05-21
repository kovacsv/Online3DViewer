import * as esbuild from 'esbuild';

esbuild.build ({
    bundle: true,
    minify: true,
    entryPoints: ['./source/engine/main.js'],
    external: ['three', 'fflate'],
    outfile: './build/o3dv.min.esm.js',
    format: "esm",
    target: ["node14"]
});
