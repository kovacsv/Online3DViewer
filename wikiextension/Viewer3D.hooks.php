<?php

$viewerCounter = 0;

class Viewer3DHooks {
	public static function OnParserFirstCallInit (&$parser)
	{
		$parser->setHook ('viewer3d', 'Viewer3DHooks::OnSampleTag');
		return true;
	}

	public static function OnSampleTag ($data, $attribs, $parser, $frame)
	{
		$parser->getOutput ()->addModules ('ext.Viewer3D');
		
		global $viewerCounter;
		$viewerCounter++;
		
		$width = 300;
		if (in_array ('width', array_keys ($attribs))) {
			$width = $attribs['width'];
		}
		
		$height = 200;
		if (in_array ('height', array_keys ($attribs))) {
			$height = $attribs['height'];
		}

		$originalFiles = '';
		if (in_array ('sourcefiles', array_keys ($attribs))) {
			$originalFiles = $attribs['sourcefiles'];
		}
		
		$sourceFiles = '';
		$splitted = explode ('|', $originalFiles);
		for ($i = 0; $i < count ($splitted); $i++) {
			$fileObject = wfFindFile ($splitted[$i]);
			if ($fileObject) {
				$filePath = $fileObject->getFullUrl ();
				$sourceFiles .= $filePath;
				if ($i < count ($splitted) - 1) {
					$sourceFiles .= '|';
				}
			}
		}
		
		$html = '';
		$html .= '<canvas class="3dviewer" width="'.$width.'" height="'.$height.'" sourcefiles="'.$sourceFiles.'"></canvas>';
		return $html;
	}
}

?>
