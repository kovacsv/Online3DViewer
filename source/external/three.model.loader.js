OV.ThreeModelLoader = class
{
    constructor ()
    {
        this.importer = new OV.Importer ();
        this.callbacks = null;
		this.inProgress = false;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

	LoadFromUrlList (urls)
	{
		if (this.inProgress) {
			return;
		}

		let obj = this;
		this.inProgress = true;
        this.callbacks.onLoadStart ();
		this.importer.LoadFilesFromUrls (urls, function () {
			obj.OnFilesLoaded ();
		});
	}
	
	LoadFromFileList (files)
	{
		if (this.inProgress) {
			return;
		}

		let obj = this;
		this.inProgress = true;
        this.callbacks.onLoadStart ();
		this.importer.LoadFilesFromFileObjects (files, function () {
			obj.OnFilesLoaded ();
		});
	}
    
	OnFilesLoaded ()
	{
		let obj = this;
		this.callbacks.onFilesLoaded ();
		
		let taskRunner = new OV.TaskRunner ();
		taskRunner.Run (1, {
			runTask : function (index, ready) {
				obj.importer.Import ({
					success : function (importResult) {
						obj.OnModelImported (importResult);
						ready ();
					},
					error : function (importError) {
						obj.callbacks.onLoadError (importError);
						obj.inProgress = false;
						ready ();
					}
				});
			}
		});
	}

	OnModelImported (importResult)
	{
		let obj = this;
		this.callbacks.onModelImported ();
		OV.ConvertModelToThreeMeshes (importResult.model, {
			onTextureLoaded : function () {
				obj.callbacks.onTextureLoaded ();
			},
			onModelLoaded : function (meshes) {
				obj.callbacks.onModelFinished (importResult, meshes);
				obj.inProgress = false;
			}
		});
	}

	GetImporter ()
	{
		return this.importer;
	}
};
