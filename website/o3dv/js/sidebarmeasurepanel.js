OV.SidebarMeasurePanel = class extends OV.SidebarPanel
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
        let activateButton = OV.AddDiv (this.contentDiv, 'ov_button ov_sidebar_button', 'Activate');
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

        this.helpSection = OV.AddDiv (this.contentDiv, 'ov_sidebar_section');
        this.resultSection = OV.AddDiv (this.contentDiv, 'ov_sidebar_section');

        this.helpSection.innerHTML = this.GetDefaultHelpText ();
    }

    UpdateMeasureTool ()
    {
        OV.ClearDomElement (this.helpSection);
        OV.ClearDomElement (this.resultSection);

        OV.ShowDomElement (this.helpSection, true);
        OV.ShowDomElement (this.resultSection, false);

        if (this.measureTool.IsActive ()) {
            let markerCount = this.measureTool.GetMarkerCount ();
            if (markerCount === 0) {
                this.helpSection.innerHTML = 'Click on a model point to start measure.';
            } else if (markerCount === 1) {
                this.helpSection.innerHTML = 'Click on another model point to see the results.';
            } else if (markerCount === 2) {
                OV.ShowDomElement (this.helpSection, false);
                OV.ShowDomElement (this.resultSection, true);

                let calculatedValues = this.measureTool.Calculate ();

                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Distance of points');
                let pointsDistanceStr = calculatedValues.pointsDistance.toLocaleString (undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                });
                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', pointsDistanceStr);

                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Distance of parallel faces');
                if (calculatedValues.parallelFacesDistance !== null) {
                    let facesDistanceStr = calculatedValues.parallelFacesDistance.toLocaleString (undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4
                    });
                    OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', facesDistanceStr);
                } else {
                    OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', 'Faces are not parallel');
                }

                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Angle of faces');
                let facesAngleDegree = calculatedValues.facesAngle * OV.RadDeg;
                let facesAngleStr = facesAngleDegree.toLocaleString (undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                });
                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', facesAngleStr + '°');

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
};
