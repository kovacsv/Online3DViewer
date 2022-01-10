import { Box3D } from './box3d.js';
import { Coord3D, CoordIsEqual3D } from './coord3d.js';
import { IsGreaterOrEqual, IsLowerOrEqual } from './geometry.js';

export class OctreeNode
{
    constructor (boundingBox, level)
    {
        this.boundingBox = boundingBox;
        this.level = level;
        this.pointItems = [];
        this.childNodes = [];
    }

    AddPoint (point, data, options)
    {
        let node = this.FindNodeForPoint (point);
        if (node === null) {
            return false;
        }

        if (node.FindPointDirectly (point) !== null) {
            return false;
        }

        if (node.pointItems.length < options.maxPointsPerNode || node.level >= options.maxTreeDepth) {
            node.AddPointDirectly (point, data);
            return true;
        } else {
            node.CreateChildNodes ();
            let oldPointItems = node.pointItems;
            node.pointItems = [];
            for (let i = 0; i < oldPointItems.length; i++) {
                let pointItem = oldPointItems[i];
                if (!node.AddPoint (pointItem.point, pointItem.data, options)) {
                    return false;
                }
            }
            return node.AddPoint (point, data, options);
        }
    }

    FindPoint (point)
    {
        let node = this.FindNodeForPoint (point);
        if (node === null) {
            return null;
        }
        return node.FindPointDirectly (point);
    }

    AddPointDirectly (point, data)
    {
        this.pointItems.push ({
            point : point,
            data : data
        });
    }

    FindPointDirectly (point)
    {
        for (let i = 0; i < this.pointItems.length; i++) {
            let pointItem = this.pointItems[i];
            if (CoordIsEqual3D (point, pointItem.point)) {
                return pointItem.data;
            }
        }
        return null;
    }

    FindNodeForPoint (point)
    {
        if (!this.IsPointInBounds (point)) {
            return null;
        }

        if (this.childNodes.length === 0) {
            return this;
        }

        for (let i = 0; i < this.childNodes.length; i++) {
            let childNode = this.childNodes[i];
            let foundNode = childNode.FindNodeForPoint (point);
            if (foundNode !== null) {
                return foundNode;
            }
        }

        return null;
    }

    CreateChildNodes ()
    {
        function AddChildNode (node, minX, minY, minZ, sizeX, sizeY, sizeZ)
        {
            let box = new Box3D (
                new Coord3D (minX, minY, minZ),
                new Coord3D (minX + sizeX, minY + sizeY, minZ + sizeZ)
            );
            node.childNodes.push (new OctreeNode (box, node.level + 1, node.options));
        }

        let min = this.boundingBox.min;
        let center = this.boundingBox.GetCenter ();
        let sizeX = (this.boundingBox.max.x - this.boundingBox.min.x) / 2.0;
        let sizeY = (this.boundingBox.max.y - this.boundingBox.min.y) / 2.0;
        let sizeZ = (this.boundingBox.max.z - this.boundingBox.min.z) / 2.0;

        AddChildNode (this, min.x, min.y, min.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, center.x, min.y, min.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, min.x, center.y, min.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, center.x, center.y, min.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, min.x, min.y, center.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, center.x, min.y, center.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, min.x, center.y, center.z, sizeX, sizeY, sizeZ);
        AddChildNode (this, center.x, center.y, center.z, sizeX, sizeY, sizeZ);
    }

    IsPointInBounds (point)
    {
        let isEqual =
            IsGreaterOrEqual (point.x, this.boundingBox.min.x) &&
            IsGreaterOrEqual (point.y, this.boundingBox.min.y) &&
            IsGreaterOrEqual (point.z, this.boundingBox.min.z) &&
            IsLowerOrEqual (point.x, this.boundingBox.max.x) &&
            IsLowerOrEqual (point.y, this.boundingBox.max.y) &&
            IsLowerOrEqual (point.z, this.boundingBox.max.z);
        return isEqual;
    }
}

export class Octree
{
    constructor (boundingBox, options)
    {
        this.options = {
            maxPointsPerNode : 10,
            maxTreeDepth : 10
        };
        if (options !== undefined) {
            if (options.maxPointsPerNode !== undefined) {
                this.options.maxPointsPerNode = options.maxPointsPerNode;
            }
            if (options.maxTreeDepth !== undefined) {
                this.options.maxTreeDepth = options.maxTreeDepth;
            }
        }
        this.rootNode = new OctreeNode (boundingBox, 0, this.options);
    }

    AddPoint (point, data)
    {
        return this.rootNode.AddPoint (point, data, this.options);
    }

    FindPoint (point)
    {
        return this.rootNode.FindPoint (point);
    }
}
