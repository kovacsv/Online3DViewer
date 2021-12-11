OV.SidebarMeasurePanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);

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
    }

    UpdateMeasureTool (measureTool)
    {
        OV.ClearDomElement (this.helpSection);
        OV.ClearDomElement (this.resultSection);

        OV.ShowDomElement (this.helpSection, true);
        OV.ShowDomElement (this.resultSection, false);

        if (measureTool.IsActive ()) {
            let markerCount = measureTool.GetMarkerCount ();
            if (markerCount === 0) {
                this.helpSection.innerHTML = 'Select a model point to start measure.';
            } else if (markerCount === 1) {
                this.helpSection.innerHTML = 'Select another model point to start measure.';
            } else if (markerCount === 2) {
                OV.ShowDomElement (this.helpSection, false);
                OV.ShowDomElement (this.resultSection, true);

                let calculatedValues = measureTool.Calculate ();

                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Distance of points');
                let pointsDistanceStr = calculatedValues.pointsDistance.toLocaleString (undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                });
                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', pointsDistanceStr);

                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Distance of parallel faces');
                if (calculatedValues.parallelFacesDistance !== null) {
                    let facesDistanceStr = calculatedValues.parallelFacesDistance.toLocaleString (undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6
                    });
                    OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', facesDistanceStr);
                } else {
                    OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', 'Faces are not parallel');
                }

                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_name', 'Angle of faces');
                let facesAngleDegree = calculatedValues.facesAngle * OV.RadDeg;
                let facesAngleStr = facesAngleDegree.toLocaleString (undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                });
                OV.AddDiv (this.resultSection, 'ov_sidebar_measure_value', facesAngleStr + '°');

            }
        }
    }

    Clear ()
    {

    }
};
