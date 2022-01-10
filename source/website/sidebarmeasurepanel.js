import { RadDeg } from '../engine/geometry/geometry.js';
import { AddDiv, ShowDomElement, ClearDomElement } from '../engine/viewer/domutils.js';
import { SidebarPanel } from './sidebarpanel.js';

export class SidebarMeasurePanel extends SidebarPanel
{
    constructor (parentDiv, measureTool)
    {
        super (parentDiv);

        this.measureTool = measureTool;
        this.helpSection = null;
        this.resultSection = null;
    }

    GetName ()
    {
        return 'Measure';
    }

    GetIcon ()
    {
        return 'measure';
    }

    Init (callbacks)
    {
        super.Init (callbacks);

        let isActive = false;
        let activateButton = AddDiv (this.contentDiv, 'ov_button ov_sidebar_button', 'Activate');
        activateButton.addEventListener ('click', () => {
            isActive = !isActive;
            if (isActive) {
                activateButton.classList.add ('outline');
                activateButton.innerHTML = 'Deactivate';
            } else {
                activateButton.classList.remove ('outline');
                activateButton.innerHTML = 'Activate';
            }
            this.callbacks.onActivatedChange (isActive);
        });

        this.helpSection = AddDiv (this.contentDiv, 'ov_sidebar_section');
        this.resultSection = AddDiv (this.contentDiv, 'ov_sidebar_section');

        this.helpSection.innerHTML = this.GetDefaultHelpText ();
    }

    UpdateMeasureTool ()
    {
        ClearDomElement (this.helpSection);
        ClearDomElement (this.resultSection);

        ShowDomElement (this.helpSection, true);
        ShowDomElement (this.resultSection, false);

        if (this.measureTool.IsActive ()) {
            let markerCount = this.measureTool.GetMarkerCount ();
            if (markerCount === 0) {
                this.helpSection.innerHTML = 'Click on a model point to start measure.';
            } else if (markerCount === 1) {
                this.helpSection.innerHTML = 'Click on another model point to see the results.';
            } else if (markerCount === 2) {
                ShowDomElement (this.helpSection, false);
                ShowDomElement (this.resultSection, true);

                let calculatedValues = this.measureTool.Calculate ();

                AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Distance of points');
                let pointsDistanceStr = calculatedValues.pointsDistance.toLocaleString (undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                });
                AddDiv (this.resultSection, 'ov_sidebar_measure_value', pointsDistanceStr);

                AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Distance of parallel faces');
                if (calculatedValues.parallelFacesDistance !== null) {
                    let facesDistanceStr = calculatedValues.parallelFacesDistance.toLocaleString (undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4
                    });
                    AddDiv (this.resultSection, 'ov_sidebar_measure_value', facesDistanceStr);
                } else {
                    AddDiv (this.resultSection, 'ov_sidebar_measure_value', 'Faces are not parallel');
                }

                AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Angle of faces');
                let facesAngleDegree = calculatedValues.facesAngle * RadDeg;
                let facesAngleStr = facesAngleDegree.toLocaleString (undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                });
                AddDiv (this.resultSection, 'ov_sidebar_measure_value', facesAngleStr + '°');

            }
        } else {
            this.helpSection.innerHTML = this.GetDefaultHelpText ();
        }
    }

    GetDefaultHelpText ()
    {
        return `<ol>
        <li>Activate measure mode with the button above.</li>
        <li>Click two points in the model to see the results.</li>
        </ol>`;
    }

    Clear ()
    {

    }
}
