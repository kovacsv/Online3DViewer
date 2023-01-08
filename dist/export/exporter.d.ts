export class Exporter {
    exporters: (Exporter3dm | ExporterBim | ExporterGltf | ExporterObj | ExporterOff | ExporterPly | ExporterStl)[];
    AddExporter(exporter: any): void;
    Export(model: any, settings: any, format: any, extension: any, callbacks: any): void;
}
import { Exporter3dm } from "./exporter3dm.js";
import { ExporterBim } from "./exporterbim.js";
import { ExporterGltf } from "./exportergltf.js";
import { ExporterObj } from "./exporterobj.js";
import { ExporterOff } from "./exporteroff.js";
import { ExporterPly } from "./exporterply.js";
import { ExporterStl } from "./exporterstl.js";
//# sourceMappingURL=exporter.d.ts.map